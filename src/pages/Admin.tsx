import React, { useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, getMetadata } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

import imageCompression from 'browser-image-compression';

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  
  const [path, setPath] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [markdowns, setMarkdowns] = useState<any[]>([]);
  const [storageFiles, setStorageFiles] = useState<{name: string, url: string, markdown: string, timeCreated: string}[]>([]);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [storagePath, setStoragePath] = useState('images/');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchMarkdowns();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchMarkdowns = async () => {
    const querySnapshot = await getDocs(collection(db, 'markdowns'));
    const items: any[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    setMarkdowns(items);
  };

  const loadStorageFiles = async () => {
    setLoadingStorage(true);
    try {
      const listRef = ref(storage, storagePath);
      const res = await listAll(listRef);
      
      const filesData = await Promise.all(res.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        return {
          name: itemRef.name,
          url,
          markdown: `![](${url})\n`,
          timeCreated: metadata.timeCreated
        };
      }));
      
      filesData.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      setStorageFiles(filesData);
    } catch (error) {
      console.error("Error loading storage:", error);
      setError("Failed to load storage files.");
    }
    setLoadingStorage(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Sort files by name naturally (e.g. 1.jpg, 2.jpg, 10.jpg)
    const sortedFiles = Array.from(files).sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
    
    setUploadingImage(true);
    setUploadProgress({ current: 0, total: sortedFiles.length });
    setError('');
    try {
      let completedCount = 0;
      const uploadedMarkdownLinks = [];
      
      let hasError = false;

      for (let i = 0; i < sortedFiles.length; i++) {
        const file = sortedFiles[i];
        
        try {
          let fileToUpload: File | Blob = file;
          if (file.type !== 'image/gif' && file.type !== 'image/webp') {
            const options = {
              maxSizeMB: 1.5,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            };
            try {
              fileToUpload = await imageCompression(file, options);
            } catch (err) {
              console.warn("Compression failed, using original file", err);
            }
          }
          
          const fileRef = ref(storage, `images/${Date.now()}_${i}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
          
          const snapshot = await uploadBytes(fileRef, fileToUpload);
          const url = await getDownloadURL(snapshot.ref);
          completedCount++;
          setUploadProgress(prev => ({ ...prev, current: completedCount }));
          uploadedMarkdownLinks.push(`![](${url})\n`);
        } catch (uploadErr: any) {
          console.error("Failed to upload file:", file.name, uploadErr);
          hasError = true;
          setError(prev => prev ? `${prev}\nFailed to upload ${file.name}` : `Failed to upload ${file.name}`);
        }
      }
      
      setContent(prev => {
        let newContent = prev;
        if (newContent && !newContent.endsWith('\n\n')) {
          newContent += '\n\n';
        }
        return newContent + uploadedMarkdownLinks.join('');
      });
      
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      setError("Image upload failed: " + err.message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadingImage(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!path.endsWith('.md')) {
      setError("Path must end with .md (e.g., 'Folder/file.md')");
      return;
    }
    setSaving(true);
    setError('');
    try {
      const docId = path.replace(/\//g, '_');
      await setDoc(doc(db, 'markdowns', docId), {
        path,
        content,
        updatedAt: Date.now()
      });
      setPath('');
      setContent('');
      fetchMarkdowns();
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this?')) {
      await deleteDoc(doc(db, 'markdowns', id));
      fetchMarkdowns();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
        <form onSubmit={handleAuth} className="bg-[#1A1A1A] p-8 rounded-2xl w-full max-w-md border border-[#F4EFE7]/10">
          <h2 className="text-2xl text-[#E8E2D9] mb-6 font-serif">{isLogin ? 'Admin Login' : 'Admin Register'}</h2>
          
          {error && <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-[#8D9B87] text-xs uppercase tracking-wider mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#111111] border border-[#F4EFE7]/10 rounded p-2 text-[#F4EFE7] focus:outline-none focus:border-[#CFA7A0]"
                required
              />
            </div>
            <div>
              <label className="block text-[#8D9B87] text-xs uppercase tracking-wider mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#111111] border border-[#F4EFE7]/10 rounded p-2 text-[#F4EFE7] focus:outline-none focus:border-[#CFA7A0]"
                required
              />
            </div>
          </div>

          <button type="submit" className="w-full mt-6 bg-[#CFA7A0] text-black font-medium p-2 rounded hover:bg-[#E8E2D9] transition-colors">
            {isLogin ? 'Login' : 'Register'}
          </button>
          
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-4 text-[#8D9B87] text-sm hover:text-[#CFA7A0]"
          >
            {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-[#F4EFE7] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-[#F4EFE7]/10 pb-4">
          <h1 className="text-2xl font-serif text-[#CFA7A0]">Admin Dashboard</h1>
          <div className="flex gap-4">
            <button onClick={() => navigate('/')} className="text-[#8D9B87] hover:text-[#E8E2D9]">View Site</button>
            <button onClick={() => signOut(auth)} className="text-[#8D9B87] hover:text-red-400">Logout</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-xl mb-4 font-serif">Add/Edit Content</h2>
            <form onSubmit={handleSave} className="space-y-4 bg-[#1A1A1A] p-6 rounded-2xl border border-[#F4EFE7]/10">
              {error && <div className="bg-red-500/10 text-red-400 p-3 rounded text-sm">{error}</div>}
              <div>
                <label className="block text-[#8D9B87] text-xs uppercase tracking-wider mb-1">Path (e.g. ChatName/character.md)</label>
                <input 
                  type="text" 
                  value={path}
                  onChange={e => setPath(e.target.value)}
                  placeholder="e.g. category/post.md"
                  className="w-full bg-[#111111] border border-[#F4EFE7]/10 rounded p-2 text-[#F4EFE7] focus:outline-none focus:border-[#CFA7A0]"
                  required
                />
                <p className="text-[10px] text-[#8D9B87] mt-1">폴더를 만들려면 `폴더명/이름.md` 형식으로 적고, 바로 이름을 그룹으로 쓰려면 `이름.md` 라고만 적으세요.</p>
                <p className="text-[10px] text-[#8D9B87] mt-1">폴더/그룹의 순서를 지정하려면 이름 앞에 숫자와 하이픈을 붙이세요. (예: `01_가족/이름.md`, `1-경화수월.md`)</p>
              </div>
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-[#8D9B87] text-xs uppercase tracking-wider">Markdown Content</label>
                  <label className="cursor-pointer text-xs bg-[#222] hover:bg-[#333] border border-[#F4EFE7]/10 px-2 py-1 rounded transition-colors text-[#CFA7A0]">
                    {uploadingImage 
                      ? `Uploading... (${uploadProgress.current}/${uploadProgress.total})` 
                      : uploadSuccess ? '✓ Uploaded!' : 'Upload Image(s)'}
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                      ref={fileInputRef}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-[#CFA7A0] mb-2">
                  * 이미지를 업로드하면 아래 창에 `![이미지명](링크)` 형태의 코드가 입력됩니다. 이 코드가 이미지를 화면에 띄우는 역할을 하니 <strong>절대 지우지 마시고</strong> 바로 Save Content를 눌러주세요.
                </p>
                <textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="# Character Name\n\n![alt text](https://link-to-image.png)"
                  rows={8}
                  className="w-full bg-[#111111] border border-[#F4EFE7]/10 rounded p-2 text-[#F4EFE7] focus:outline-none focus:border-[#CFA7A0] font-mono text-sm"
                />
                
                {content.match(/!\[.*?\]\(.*?\)/) && (
                  <div className="mt-4 p-4 border border-[#F4EFE7]/10 rounded bg-[#111]">
                    <h3 className="text-xs text-[#8D9B87] uppercase tracking-wider mb-2">Image Preview</h3>
                    <div className="flex gap-2 flex-wrap">
                      {Array.from(content.matchAll(/!\[.*?\]\((.*?)\)/g)).map((match, i) => (
                        <img key={i} src={match[1]} alt="preview" className="h-20 object-cover rounded border border-[#F4EFE7]/20" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                disabled={saving}
                className="bg-[#CFA7A0] text-black font-medium p-2 rounded hover:bg-[#E8E2D9] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Content'}
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-xl mb-4 font-serif">Existing Dynamic Markdowns</h2>
            <div className="space-y-4">
              {markdowns.length === 0 && <p className="text-[#8D9B87]">No dynamic content yet.</p>}
              {markdowns.map(item => (
                <div key={item.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-[#F4EFE7]/10 flex justify-between items-start">
                  <div>
                    <div className="text-[#CFA7A0] font-medium mb-1">{item.path}</div>
                    <div className="text-xs text-[#8D9B87] truncate max-w-xs">{item.content.substring(0, 50)}...</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => { setPath(item.path); setContent(item.content); }}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#F4EFE7]/10 pt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-serif">Storage Image Library</h2>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={storagePath}
                onChange={(e) => setStoragePath(e.target.value)}
                placeholder="Folder path (e.g. images/)"
                className="bg-[#111] border border-[#F4EFE7]/20 p-2 rounded text-sm w-64 focus:outline-none focus:border-[#CFA7A0] text-[#F4EFE7]"
              />
              <button 
                onClick={loadStorageFiles}
                disabled={loadingStorage || !storagePath.trim()}
                className="bg-[#222] hover:bg-[#333] border border-[#F4EFE7]/10 px-4 py-2 rounded text-sm text-[#CFA7A0] transition-colors disabled:opacity-50"
              >
                {loadingStorage ? 'Loading...' : 'Load'}
              </button>
            </div>
          </div>
          <p className="text-sm text-[#8D9B87] mb-6">
            파이어베이스 스토리지에 직접 생성한 폴더 경로(예: images/캐릭터이름/)를 입력하여 불러올 수 있습니다.
          </p>
          
          {storageFiles.length > 0 && (
            <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-[#F4EFE7]/10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-[#8D9B87]">Total: {storageFiles.length} images</span>
                <button 
                  onClick={() => {
                    const allLinks = storageFiles.map(f => f.markdown).join('');
                    navigator.clipboard.writeText(allLinks);
                    alert('All markdown links copied to clipboard!');
                  }}
                  className="bg-[#CFA7A0] text-black text-sm px-3 py-1 rounded hover:bg-[#E8E2D9]"
                >
                  Copy All Markdown Links
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {storageFiles.map((file, i) => (
                  <div key={i} className="bg-[#111] p-2 rounded border border-[#F4EFE7]/10 flex flex-col group relative">
                    <img src={file.url} alt={file.name} className="w-full h-32 object-cover rounded mb-2" />
                    <div className="text-[10px] text-[#8D9B87] truncate mb-2" title={file.name}>{file.name}</div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(file.markdown);
                        // Optional: visual feedback
                      }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs rounded"
                    >
                      Copy Markdown
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
