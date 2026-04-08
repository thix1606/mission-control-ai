import { useState, useEffect } from 'react';
import { FileText, Save, FileEdit, RefreshCw, X } from 'lucide-react';
import type { OpenClawConfig } from '../types';
import { listAgentFiles, readAgentFile, writeAgentFile } from '../services/openclawWs';

export function AgentFiles({ agentId, config }: { agentId: string; config: OpenClawConfig }) {
  const [files, setFiles] = useState<string[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchFiles = async () => {
    setLoadingFiles(true);
    const list = await listAgentFiles(config, agentId);
    setFiles(list.filter(f => f.endsWith('.md') || f.endsWith('.json') || f.endsWith('.txt') || f.endsWith('.yaml') || f.endsWith('.yml')));
    setLoadingFiles(false);
  };

  useEffect(() => {
    fetchFiles();
  }, [agentId, config]);

  const handleSelectFile = async (f: string) => {
    setActiveFile(f);
    setLoadingContent(true);
    const text = await readAgentFile(config, agentId, f);
    setContent(text ?? '');
    setLoadingContent(false);
  };

  const handleSave = async () => {
    if (!activeFile) return;
    setSaving(true);
    await writeAgentFile(config, agentId, activeFile, content);
    setSaving(false);
  };

  if (activeFile) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col" style={{ minHeight: '600px' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-800/50">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveFile(null)} className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700">
              <X className="w-4 h-4" />
            </button>
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-mono text-gray-200">{activeFile}</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loadingContent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Salvar
          </button>
        </div>
        {loadingContent ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full bg-gray-900 text-gray-300 font-mono text-sm p-4 focus:outline-none resize-none"
            spellCheck={false}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Arquivos do Workspace
        </h3>
        <button onClick={fetchFiles} disabled={loadingFiles} className="text-gray-400 hover:text-white disabled:animate-spin">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {loadingFiles ? (
        <p className="text-sm text-gray-600 text-center py-8">Carregando arquivos...</p>
      ) : files.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-8">Nenhum arquivo editável encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map(f => (
            <button
              key={f}
              onClick={() => handleSelectFile(f)}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 bg-gray-800/20 hover:bg-gray-800 hover:border-indigo-500/30 transition-colors text-left group"
            >
              <FileEdit className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
              <span className="text-sm font-mono text-gray-300 truncate">{f}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
