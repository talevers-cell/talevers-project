import React, { useState, useEffect } from 'react';

const STORY_OPTIONS = [
  "تعلم الصلاة", "الأخلاق الإسلامية", "قصة قبل النوم", "الشجاعة والثقة بالنفس",
  "اللطف ومساعدة الآخرين", "بر الوالدين", "حب النبي ﷺ", "الأمانة والصدق",
  "أهمية النظافة", "التعاون مع الأصدقاء", "حماية البيئة", "أخرى (نص حر)"
];

const TaleVersApp = () => {
  const [formData, setFormData] = useState({
    name: '', age: '', storyType: STORY_OPTIONS[0],
    childImg: null, parent1Img: null, parent2Img: null, includeParents: false
  });

  const [status, setStatus] = useState('idle');
  const [story, setStory] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);

  // ✅ NEW: upload status/errors per file
  const [uploading, setUploading] = useState({
    childImg: false,
    parent1Img: false,
    parent2Img: false,
  });
  const [uploadError, setUploadError] = useState({
    childImg: '',
    parent1Img: '',
    parent2Img: '',
  });

  // ✅ NEW: file -> base64
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // data:image/...;base64,...
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // ✅ NEW: call your Vercel API route (serverless) which uploads to Cloudinary
  const uploadToCloudinary = async (file, folder) => {
    const imageBase64 = await fileToBase64(file);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, folder }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Upload failed");
    if (!data?.url) throw new Error("No URL returned from upload API");

    return data.url; // Cloudinary URL
  };

  // ✅ UPDATED: handleFile now uploads & saves URL (instead of only local preview)
  const handleFile = async (e, key) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Optional: quick local preview while uploading (keeps your current behavior)
    const localPreview = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, [key]: localPreview }));

    setUploading((prev) => ({ ...prev, [key]: true }));
    setUploadError((prev) => ({ ...prev, [key]: '' }));

    try {
      // choose folders
      const folder =
        key === "childImg" ? "talevers/children" :
        key === "parent1Img" ? "talevers/parents/mom" :
        key === "parent2Img" ? "talevers/parents/dad" :
        "talevers/uploads";

      const cloudUrl = await uploadToCloudinary(file, folder);

      // ✅ Save the Cloudinary URL into formData (this is the "saved" proof)
      setFormData((prev) => ({ ...prev, [key]: cloudUrl }));
    } catch (err) {
      setUploadError((prev) => ({ ...prev, [key]: err.message || "Upload error" }));
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const generateStory = () => {
    // ✅ Require name + childImg AND ensure child upload finished with no error
    if (!formData.name) return alert("الرجاء إدخال اسم الطفل");
    if (!formData.childImg) return alert("الرجاء رفع صورة الطفل");
    if (uploading.childImg) return alert("انتظر: جاري رفع صورة الطفل...");
    if (uploadError.childImg) return alert("خطأ في رفع صورة الطفل. حاول مرة أخرى.");

    // If include parents, block if still uploading or has errors (optional but recommended)
    if (formData.includeParents) {
      if (uploading.parent1Img || uploading.parent2Img) {
        return alert("انتظر: جاري رفع صور الوالدين...");
      }
      if (uploadError.parent1Img || uploadError.parent2Img) {
        return alert("يوجد خطأ في رفع صور الوالدين. أصلحها أو ألغِ خيار إضافة الوالدين.");
      }
    }

    setStatus('loading');

    // محاكاة استدعاء Nanobanana Pro لإنتاج 25 صفحة
    setTimeout(() => {
      const pages = Array.from({ length: 25 }, (_, i) => ({
        title: `الفصل ${i + 1}`,
        text: `في هذه الصفحة، يتعلم ${formData.name} قيمة جديدة من ${formData.storyType}. إنه يوم مميز جداً!`,
        image: formData.childImg, // ✅ now it's Cloudinary URL (saved)
      }));
      setStory(pages);
      setStatus('success');
    }, 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-right" dir="rtl">
      {status === 'idle' && (
        <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-xl border-t-4 border-blue-600">
          <h1 className="text-2xl font-bold text-center mb-6">TaleVers: صانع القصص الذكي</h1>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="اسم الطفل"
              className="w-full p-3 border rounded"
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="العمر"
              className="w-full p-3 border rounded"
              onChange={e => setFormData({ ...formData, age: e.target.value })}
            />

            <select
              className="w-full p-3 border rounded"
              onChange={e => setFormData({ ...formData, storyType: e.target.value })}
            >
              {STORY_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
            </select>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="font-bold mb-2">صورة الطفل (لـ Identity Lock):</p>
              <input type="file" accept="image/*" onChange={e => handleFile(e, 'childImg')} />

              {/* ✅ NEW: upload feedback */}
              <div className="mt-2 text-sm">
                {uploading.childImg && <p>جارٍ رفع صورة الطفل وحفظها...</p>}
                {uploadError.childImg && <p style={{ color: "red" }}>خطأ: {uploadError.childImg}</p>}
                {formData.childImg && !uploading.childImg && !uploadError.childImg && (
                  <p style={{ color: "green" }}>✅ تم حفظ صورة الطفل</p>
                )}
              </div>

              {/* Optional: show thumbnail */}
              {formData.childImg && (
                <img
                  src={formData.childImg}
                  alt="child"
                  style={{ maxWidth: 180, borderRadius: 12, marginTop: 10 }}
                />
              )}
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <label className="flex items-center cursor-pointer font-bold">
                <input
                  type="checkbox"
                  className="ml-2"
                  onChange={e => setFormData({ ...formData, includeParents: e.target.checked })}
                />
                إضافة الوالدين للقصة
              </label>

              {formData.includeParents && (
                <div className="mt-3 space-y-2">
                  <input type="file" accept="image/*" onChange={e => handleFile(e, 'parent1Img')} />
                  <p className="text-xs">صورة الأم (ستظهر بالحجاب)</p>

                  {/* ✅ NEW: feedback mom */}
                  <div className="text-sm">
                    {uploading.parent1Img && <p>جارٍ رفع صورة الأم...</p>}
                    {uploadError.parent1Img && <p style={{ color: "red" }}>خطأ: {uploadError.parent1Img}</p>}
                    {formData.parent1Img && !uploading.parent1Img && !uploadError.parent1Img && (
                      <p style={{ color: "green" }}>✅ تم حفظ صورة الأم</p>
                    )}
                  </div>

                  <input type="file" accept="image/*" onChange={e => handleFile(e, 'parent2Img')} />
                  <p className="text-xs">صورة الأب</p>

                  {/* ✅ NEW: feedback dad */}
                  <div className="text-sm">
                    {uploading.parent2Img && <p>جارٍ رفع صورة الأب...</p>}
                    {uploadError.parent2Img && <p style={{ color: "red" }}>خطأ: {uploadError.parent2Img}</p>}
                    {formData.parent2Img && !uploading.parent2Img && !uploadError.parent2Img && (
                      <p style={{ color: "green" }}>✅ تم حفظ صورة الأب</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={generateStory}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold"
              disabled={uploading.childImg} // ✅ prevents click while uploading child
            >
              إنشاء القصة (25 صفحة)
            </button>
          </div>
        </div>
      )}

      {status === 'loading' && <div className="text-center mt-20 font-bold">جاري توليد الصور وتثبيت الهوية...</div>}

      {status === 'success' && (
        <div className="max-w-4xl mx-auto">
          <div className="no-print flex justify-between mb-4 bg-white p-4 rounded-lg shadow">
            <button onClick={() => setStatus('idle')} className="text-blue-600">تعديل</button>
            <button onClick={handlePrint} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold">تحميل PDF / طباعة</button>
          </div>

          {/* القارئ التفاعلي (يظهر في المتصفح فقط) */}
          <div className="no-print bg-white p-6 rounded-xl shadow-lg text-center">
            <img src={story[currentPage].image} className="w-full max-h-96 object-contain rounded mb-4" />
            <h2 className="text-xl font-bold mb-2">{story[currentPage].title}</h2>
            <p className="mb-6">{story[currentPage].text}</p>
            <div className="flex justify-between items-center">
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(c => c - 1)}
                className="p-2 bg-gray-200 rounded"
              >
                السابق
              </button>
              <span>{currentPage + 1} / 25</span>
              <button
                disabled={currentPage === 24}
                onClick={() => setCurrentPage(c => c + 1)}
                className="p-2 bg-blue-600 text-white rounded"
              >
                التالي
              </button>
            </div>
          </div>

          {/* قسم الطباعة (مخفي في المتصفح، يظهر في الـ PDF) */}
          <div className="print-area hidden">
            {story.map((page, i) => (
              <div key={i} className="print-page">
                <img src={page.image} className="print-img" />
                <h1 className="print-title">{page.title}</h1>
                <p className="print-text">{page.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { display: block !important; }
          .print-page { 
            page-break-after: always; 
            height: 297mm; 
            width: 210mm; 
            padding: 20mm;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .print-img { max-width: 100%; height: 150mm; object-fit: contain; margin-bottom: 20mm; }
          .print-title { font-size: 32pt; font-weight: bold; margin-bottom: 10mm; }
          .print-text { font-size: 22pt; line-height: 1.6; }
        }
      `}</style>
    </div>
  );
};

export default TaleVersApp;
