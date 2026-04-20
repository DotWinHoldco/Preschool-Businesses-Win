'use client'

// @anchor: cca.documents.documents-client
// Two-pane document manager: folder tree + file list

import { useState, useMemo, useCallback } from 'react'
import {
  Folder,
  FolderOpen,
  FileText,
  Upload,
  FolderPlus,
  Download,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DocFolder {
  id: string
  name: string
  parentId: string | null
}

export interface DocFile {
  id: string
  name: string
  type: string
  size: string
  folderId: string
  uploaded_at: string
  uploaded_by: string
}

interface DocumentsClientProps {
  initialFolders: DocFolder[]
  initialFiles: DocFile[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentsClient({
  initialFolders,
  initialFiles,
}: DocumentsClientProps) {
  const [folders, setFolders] = useState<DocFolder[]>(initialFolders)
  const [files, setFiles] = useState<DocFile[]>(initialFiles)
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    initialFolders[0]?.id ?? '',
  )
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set(initialFolders.map((f) => f.id)),
  )

  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<DocFile | null>(null)

  // Form states
  const [uploadFileName, setUploadFileName] = useState('')
  const [uploadFileType, setUploadFileType] = useState('PDF')
  const [newFolderName, setNewFolderName] = useState('')
  const [renameValue, setRenameValue] = useState('')

  // Sidebar collapsed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const selectedFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId),
    [folders, selectedFolderId],
  )

  const filteredFiles = useMemo(
    () => files.filter((f) => f.folderId === selectedFolderId),
    [files, selectedFolderId],
  )

  // Folder tree: top-level folders (parentId === null)
  const topLevelFolders = useMemo(
    () => folders.filter((f) => f.parentId === null),
    [folders],
  )

  const childFolders = useCallback(
    (parentId: string) => folders.filter((f) => f.parentId === parentId),
    [folders],
  )

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }, [])

  // Upload handler (client-side mock)
  const handleUpload = useCallback(() => {
    if (!uploadFileName.trim()) return
    const newFile: DocFile = {
      id: crypto.randomUUID(),
      name: uploadFileName.trim(),
      type: uploadFileType,
      size: '0 KB',
      folderId: selectedFolderId,
      uploaded_at: new Date().toISOString(),
      uploaded_by: 'You',
    }
    setFiles((prev) => [newFile, ...prev])
    setUploadDialogOpen(false)
    setUploadFileName('')
    setUploadFileType('PDF')
  }, [uploadFileName, uploadFileType, selectedFolderId])

  // New folder handler
  const handleNewFolder = useCallback(() => {
    if (!newFolderName.trim()) return
    const newFolder: DocFolder = {
      id: crypto.randomUUID(),
      name: newFolderName.trim(),
      parentId: null,
    }
    setFolders((prev) => [...prev, newFolder])
    setNewFolderDialogOpen(false)
    setNewFolderName('')
    setSelectedFolderId(newFolder.id)
  }, [newFolderName])

  // Rename handler
  const handleRename = useCallback(() => {
    if (!renameTarget || !renameValue.trim()) return
    setFiles((prev) =>
      prev.map((f) =>
        f.id === renameTarget.id ? { ...f, name: renameValue.trim() } : f,
      ),
    )
    setRenameDialogOpen(false)
    setRenameTarget(null)
    setRenameValue('')
  }, [renameTarget, renameValue])

  // Delete handler
  const handleDelete = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }, [])

  // Render folder tree node
  const renderFolderNode = (folder: DocFolder, depth: number = 0) => {
    const children = childFolders(folder.id)
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = folder.id === selectedFolderId
    const hasChildren = children.length > 0
    const fileCount = files.filter((f) => f.folderId === folder.id).length

    return (
      <div key={folder.id}>
        <button
          type="button"
          className={cn(
            'w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors text-left',
          )}
          style={{
            paddingLeft: `${depth * 16 + 8}px`,
            backgroundColor: isSelected
              ? 'var(--color-muted)'
              : 'transparent',
            color: isSelected
              ? 'var(--color-foreground)'
              : 'var(--color-muted-foreground)',
          }}
          onClick={() => {
            setSelectedFolderId(folder.id)
            if (hasChildren) toggleFolder(folder.id)
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={14} className="shrink-0" />
            ) : (
              <ChevronRight size={14} className="shrink-0" />
            )
          ) : (
            <span className="w-[14px] shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen size={16} className="shrink-0" />
          ) : (
            <Folder size={16} className="shrink-0" />
          )}
          <span className="truncate flex-1">{folder.name}</span>
          {fileCount > 0 && (
            <span
              className="text-xs tabular-nums"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              {fileCount}
            </span>
          )}
        </button>
        {isExpanded &&
          children.map((child) => renderFolderNode(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="flex gap-0 lg:gap-4 flex-col lg:flex-row min-h-[500px]">
      {/* Mobile toggle */}
      <div className="lg:hidden mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Folder size={16} />
          {selectedFolder?.name || 'Folders'}
          <ChevronDown
            size={14}
            className={cn(
              'transition-transform',
              sidebarOpen && 'rotate-180',
            )}
          />
        </Button>
      </div>

      {/* Sidebar: folder tree */}
      <div
        className={cn(
          'lg:w-[250px] shrink-0 rounded-lg border p-3',
          !sidebarOpen && 'hidden lg:block',
        )}
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-card)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            Folders
          </h3>
          <button
            onClick={() => {
              setNewFolderName('')
              setNewFolderDialogOpen(true)
            }}
            className="rounded p-1 transition-colors"
            style={{ color: 'var(--color-primary)' }}
            aria-label="New folder"
          >
            <Plus size={14} />
          </button>
        </div>
        <nav className="space-y-0.5">
          {topLevelFolders.map((folder) => renderFolderNode(folder))}
        </nav>
      </div>

      {/* Main content: file list */}
      <div className="flex-1 min-w-0">
        {/* File list toolbar */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--color-foreground)' }}
          >
            {selectedFolder?.name || 'All Files'}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setNewFolderName('')
                setNewFolderDialogOpen(true)
              }}
            >
              <FolderPlus size={16} />
              New Folder
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setUploadFileName('')
                setUploadFileType('PDF')
                setUploadDialogOpen(true)
              }}
            >
              <Upload size={16} />
              Upload
            </Button>
          </div>
        </div>

        {/* File table */}
        {filteredFiles.length === 0 ? (
          <div
            className="rounded-lg border p-12 text-center"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-card)',
            }}
          >
            <FileText
              size={40}
              className="mx-auto mb-3"
              style={{ color: 'var(--color-muted-foreground)' }}
            />
            <p
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--color-foreground)' }}
            >
              No files in this folder
            </p>
            <p
              className="text-sm mb-4"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Upload a document or drag and drop files here.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setUploadFileName('')
                setUploadFileType('PDF')
                setUploadDialogOpen(true)
              }}
            >
              <Upload size={16} />
              Upload File
            </Button>
          </div>
        ) : (
          <div
            className="rounded-lg border overflow-hidden"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-card)',
            }}
          >
            {/* Table header */}
            <div
              className="hidden sm:grid grid-cols-[1fr_80px_80px_120px_100px_80px] gap-3 px-4 py-2.5 text-xs font-medium uppercase tracking-wide border-b"
              style={{
                color: 'var(--color-muted-foreground)',
                borderColor: 'var(--color-border)',
              }}
            >
              <span>Name</span>
              <span>Type</span>
              <span>Size</span>
              <span>Uploaded</span>
              <span>By</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Table rows */}
            <div
              className="divide-y"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_120px_100px_80px] gap-2 sm:gap-3 px-4 py-3 items-center"
                >
                  {/* Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText
                      size={16}
                      className="shrink-0"
                      style={{ color: 'var(--color-primary)' }}
                    />
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--color-foreground)' }}
                    >
                      {file.name}
                    </span>
                  </div>

                  {/* Type */}
                  <span
                    className="hidden sm:block text-xs"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {file.type}
                  </span>

                  {/* Size */}
                  <span
                    className="hidden sm:block text-xs tabular-nums"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {file.size}
                  </span>

                  {/* Uploaded at */}
                  <span
                    className="hidden sm:block text-xs"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {new Date(file.uploaded_at).toLocaleDateString()}
                  </span>

                  {/* Uploaded by */}
                  <span
                    className="hidden sm:block text-xs"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {file.uploaded_by}
                  </span>

                  {/* Mobile metadata */}
                  <div className="flex items-center gap-3 sm:hidden">
                    <span
                      className="text-xs"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {file.type}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {file.size}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {file.uploaded_by}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    <button
                      className="rounded p-1.5 transition-colors"
                      style={{ color: 'var(--color-muted-foreground)' }}
                      aria-label={`Download ${file.name}`}
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      className="rounded p-1.5 transition-colors"
                      style={{ color: 'var(--color-muted-foreground)' }}
                      aria-label={`Rename ${file.name}`}
                      title="Rename"
                      onClick={() => {
                        setRenameTarget(file)
                        setRenameValue(file.name)
                        setRenameDialogOpen(true)
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="rounded p-1.5 transition-colors"
                      style={{ color: 'var(--color-destructive)' }}
                      aria-label={`Delete ${file.name}`}
                      title="Delete"
                      onClick={() => handleDelete(file.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogOverlay onClick={() => setUploadDialogOpen(false)} />
        <DialogContent title="Upload Document">
          <DialogClose onClick={() => setUploadDialogOpen(false)} />
          <div className="space-y-4">
            <div>
              <label
                htmlFor="upload-name"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-foreground)' }}
              >
                File Name *
              </label>
              <Input
                id="upload-name"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                placeholder="e.g., Staff Handbook 2026"
                inputSize="sm"
              />
            </div>

            <div>
              <label
                htmlFor="upload-type"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-foreground)' }}
              >
                File Type
              </label>
              <select
                id="upload-type"
                value={uploadFileType}
                onChange={(e) => setUploadFileType(e.target.value)}
                className="w-full rounded-[var(--radius,0.75rem)] border px-4 py-2 text-sm min-h-[48px]"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-foreground)',
                }}
              >
                <option value="PDF">PDF</option>
                <option value="DOCX">DOCX</option>
                <option value="XLSX">XLSX</option>
                <option value="PNG">PNG</option>
                <option value="JPG">JPG</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div
              className="rounded-lg border-2 border-dashed p-6 text-center"
              style={{
                borderColor: 'var(--color-border)',
              }}
            >
              <Upload
                size={24}
                className="mx-auto mb-2"
                style={{ color: 'var(--color-muted-foreground)' }}
              />
              <p
                className="text-sm"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                File upload is a placeholder. In production, files will be
                uploaded to secure storage.
              </p>
            </div>

            <p
              className="text-xs"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Uploading to: <strong>{selectedFolder?.name || 'General'}</strong>
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setUploadDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={!uploadFileName.trim()}
              >
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
      >
        <DialogOverlay onClick={() => setNewFolderDialogOpen(false)} />
        <DialogContent title="New Folder">
          <DialogClose onClick={() => setNewFolderDialogOpen(false)} />
          <div className="space-y-4">
            <div>
              <label
                htmlFor="folder-name"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-foreground)' }}
              >
                Folder Name *
              </label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Financial Records"
                inputSize="sm"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setNewFolderDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleNewFolder}
                disabled={!newFolderName.trim()}
              >
                Create Folder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogOverlay onClick={() => setRenameDialogOpen(false)} />
        <DialogContent title="Rename File">
          <DialogClose onClick={() => setRenameDialogOpen(false)} />
          <div className="space-y-4">
            <div>
              <label
                htmlFor="rename-value"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-foreground)' }}
              >
                New Name *
              </label>
              <Input
                id="rename-value"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                inputSize="sm"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRenameDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRename}
                disabled={!renameValue.trim()}
              >
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
