import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Camera, Image as ImageIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { uid } from "@/utils/gymConfig";

export default function PhotoLibraryModal({
  open,
  setOpen,
  photos,
  setPhotos,
  todayKey,
  lastWt,
  units,
  showToast,
}) {
  const compressPhoto = (dataUrl, maxDim = 1080) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > maxDim || h > maxDim) {
          if (w >= h) {
            h = Math.round(h * (maxDim / w));
            w = maxDim;
          } else {
            w = Math.round(w * (maxDim / h));
            h = maxDim;
          }
        }
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleAdd = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const compressed = await compressPhoto(e.target.result);
      const newP = {
        id: uid(),
        dataUrl: compressed,
        dateKey: todayKey,
        date: format(new Date(), "MMM dd"),
        dateUpper: format(new Date(), "MMM dd").toUpperCase(),
        weight: lastWt ? `${lastWt.weight.toFixed(1)} ${units}` : "—",
      };
      setPhotos([newP, ...photos]);
      showToast("Photo added");
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#000] border-none text-white w-full max-w-lg h-[90vh] md:h-[80vh] flex flex-col p-0 rounded-t-2xl md:rounded-3xl overflow-hidden gap-0">
        <div className="flex items-center gap-4 p-5">
          <button
            onClick={() => setOpen(false)}
            className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full"
          >
            ←
          </button>
          <div className="text-xl font-bold">Progress Gallery</div>
        </div>
        <div className="grid grid-cols-2 gap-3 px-5 mb-4">
          <label className="h-14 rounded-xl bg-[#6ee7b7] text-black font-bold flex items-center justify-center cursor-pointer">
            <Camera className="w-5 h-5 mr-2" /> Take Photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleAdd(e.target.files[0])}
              className="hidden"
            />
          </label>
          <label className="h-14 rounded-xl bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer hover:bg-white/20">
            <ImageIcon className="w-5 h-5 mr-2" /> Library
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleAdd(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-8 grid grid-cols-2 gap-3">
          {photos.length === 0 && (
            <div className="col-span-2 text-center text-white/40 mt-10">
              No photos yet.
            </div>
          )}
          {photos.map((p) => (
            <div
              key={p.id}
              className="relative aspect-[3/4] rounded-xl overflow-hidden group"
            >
              <img
                src={p.dataUrl}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end text-xs font-medium">
                <span className="text-[#6ee7b7]">{p.date}</span>
                <span>{p.weight}</span>
              </div>
              <button
                onClick={() => {
                  if (confirm("Delete this photo?"))
                    setPhotos(photos.filter((x) => x.id !== p.id));
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4 text-[#f87171]" />
              </button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
