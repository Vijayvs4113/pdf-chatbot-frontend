import { useState } from "react";
import { api } from "../api";

export default function UploadPdf({ onUpload }: { onUpload: () => void }) {
  const [file, setFile] = useState<File | null>(null);

  const upload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("pdf", file);

    await api.post("/pdf/upload", formData);
    onUpload();
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button onClick={upload}>Upload</button>
    </div>
  );
}
