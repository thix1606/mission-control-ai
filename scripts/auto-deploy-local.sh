#!/bin/bash
# ============================================================
# AUTO-DEPLOY LOCAL — Mission Control AI (host do OpenClaw)
# ============================================================
# Baixa o artefato "dist" do último build bem-sucedido da branch main
# no GitHub Actions e publica em DEPLOY_DIR.
#
# Regras de segurança (motivo de existir esta versão):
#   - NUNCA apaga o deploy atual antes de ter um build novo validado
#     (index.html + assets/ presentes) num diretório temporário.
#   - Artefato expirado ou download com falha => mantém o site no ar,
#     loga o motivo e sai com erro. Sem fallback de build local.
#   - Token do GitHub lido de arquivo (chmod 600), nunca hardcoded.
#   - Lock via flock para evitar execuções concorrentes do cron.
#
# Instalação (como usuário openclaw):
#   install -m 700 scripts/auto-deploy-local.sh /home/openclaw/auto-deploy-local.sh
#   mkdir -p ~/.config/mission-control && chmod 700 ~/.config/mission-control
#   printf '%s\n' "$(gh auth token)" > ~/.config/mission-control/github-token
#   chmod 600 ~/.config/mission-control/github-token
#
# Crontab (a cada 2 minutos):
#   */2 * * * * /home/openclaw/auto-deploy-local.sh >> /home/openclaw/deploy-local.log 2>&1
#
# Variáveis de ambiente opcionais:
#   REPO, DEPLOY_DIR, STATE_FILE, TOKEN_FILE, GITHUB_TOKEN
# ============================================================

set -euo pipefail
export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:/usr/local/bin:/usr/bin:/bin"

REPO="${REPO:-thix1606/mission-control-ai}"
DEPLOY_DIR="${DEPLOY_DIR:-/var/www/mission-control}"
STATE_FILE="${STATE_FILE:-$HOME/.last-deploy-local}"
TOKEN_FILE="${TOKEN_FILE:-$HOME/.config/mission-control/github-token}"
LOCK_FILE="${LOCK_FILE:-/tmp/mission-control-deploy.lock}"
API="https://api.github.com/repos/$REPO"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*"; }
die() { log "ERRO: $*"; exit 1; }

# ── Lock: evita duas execuções simultâneas ────────────────
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "Outra execução em andamento; saindo."
  exit 0
fi

# ── Token ────────────────────────────────────────────────
if [ -n "${GITHUB_TOKEN:-}" ]; then
  TOKEN="$GITHUB_TOKEN"
elif [ -r "$TOKEN_FILE" ]; then
  TOKEN="$(tr -d '[:space:]' < "$TOKEN_FILE")"
else
  die "Token do GitHub não encontrado. Defina GITHUB_TOKEN ou crie $TOKEN_FILE (chmod 600)."
fi
[ -n "$TOKEN" ] || die "Token do GitHub vazio."

gh_api() {
  curl -sS --fail-with-body -m 30 \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "$@"
}

# ── Último run bem-sucedido da main ───────────────────────
RUNS_JSON="$(gh_api "$API/actions/runs?branch=main&status=success&per_page=1")" \
  || die "Falha ao consultar runs no GitHub (token inválido ou sem permissão?)."
LATEST_RUN="$(echo "$RUNS_JSON" | jq -r '.workflow_runs[0].id // empty')"
LATEST_SHA="$(echo "$RUNS_JSON" | jq -r '.workflow_runs[0].head_sha // empty' | cut -c1-7)"
[ -n "$LATEST_RUN" ] || { log "Nenhum run bem-sucedido encontrado."; exit 0; }

LAST_RUN="$(cat "$STATE_FILE" 2>/dev/null || echo 0)"
if [ "$LATEST_RUN" = "$LAST_RUN" ]; then
  # Nada novo. Se o deploy atual sumiu por qualquer motivo, avisa em vez de ficar em silêncio.
  if [ ! -f "$DEPLOY_DIR/index.html" ]; then
    log "ATENÇÃO: run $LATEST_RUN já processado, mas $DEPLOY_DIR/index.html não existe. Faça um push na main para gerar artefato novo, ou copie o dist manualmente."
    exit 1
  fi
  exit 0
fi

log "Novo build detectado: run #$LATEST_RUN (commit $LATEST_SHA)"

# ── Artefato ─────────────────────────────────────────────
ARTIFACTS_JSON="$(gh_api "$API/actions/runs/$LATEST_RUN/artifacts")" \
  || die "Falha ao listar artefatos do run $LATEST_RUN."
ARTIFACT_URL="$(echo "$ARTIFACTS_JSON" | jq -r '.artifacts[] | select(.name=="dist" and .expired==false) | .archive_download_url' | head -1)"
if [ -z "$ARTIFACT_URL" ]; then
  # Artefato expirado (retenção de 7 dias) ou ausente. NÃO mexe no deploy atual.
  die "Artefato 'dist' do run $LATEST_RUN indisponível ou expirado. Deploy atual mantido. Faça um novo push na main para gerar outro."
fi

# ── Download e validação em diretório temporário ─────────
WORK="$(mktemp -d /tmp/mission-control-deploy.XXXXXX)"
trap 'rm -rf "$WORK"' EXIT

log "Baixando artefato..."
gh_api -L "$ARTIFACT_URL" -o "$WORK/dist.zip" || die "Falha no download do artefato."
python3 -c "import zipfile,sys; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])" "$WORK/dist.zip" "$WORK/dist" \
  || die "Falha ao extrair o artefato."

[ -f "$WORK/dist/index.html" ] || die "Build inválido: index.html ausente no artefato. Deploy atual mantido."
[ -d "$WORK/dist/assets" ] && [ -n "$(ls -A "$WORK/dist/assets")" ] || die "Build inválido: assets/ vazio. Deploy atual mantido."

# ── Publicação atômica: só agora substitui o deploy ───────
mkdir -p "$DEPLOY_DIR"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "$WORK/dist/" "$DEPLOY_DIR/"
else
  find "$DEPLOY_DIR" -mindepth 1 -delete
  cp -r "$WORK/dist/." "$DEPLOY_DIR/"
fi
chmod -R u=rwX,go=rX "$DEPLOY_DIR"

[ -f "$DEPLOY_DIR/index.html" ] || die "Publicação falhou: index.html não está em $DEPLOY_DIR."

echo "$LATEST_RUN" > "$STATE_FILE"
log "Deploy concluído! Run #$LATEST_RUN (commit $LATEST_SHA)"
