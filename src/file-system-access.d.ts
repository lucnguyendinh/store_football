// Chromium File System Access API (not in all TypeScript DOM lib versions)
interface Window {
  showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
}
