// DOM 元素
const uploadArea = document.getElementById("uploadArea");
const imageInput = document.getElementById("imageInput");
const previewArea = document.getElementById("previewArea");
const originalPreview = document.getElementById("originalPreview");
const compressedPreview = document.getElementById("compressedPreview");
const originalSize = document.getElementById("originalSize");
const compressedSize = document.getElementById("compressedSize");
const quality = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");
const downloadBtn = document.getElementById("downloadBtn");

// 文件大小格式化
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// 处理图片上传
function handleImageUpload(file) {
  if (!file.type.match("image.*")) {
    alert("请上传图片文件！");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    // 显示原图
    originalPreview.src = e.target.result;
    originalSize.textContent = formatFileSize(file.size);

    // 显示预览区域
    previewArea.hidden = false;

    // 压缩图片
    compressImage(e.target.result);
  };
  reader.readAsDataURL(file);
}

// 压缩图片
function compressImage(imageData) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // 保持原始宽高比
    canvas.width = img.width;
    canvas.height = img.height;

    // 绘制图片
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // 压缩图片
    const compressedDataUrl = canvas.toDataURL(
      "image/jpeg",
      quality.value / 100
    );
    compressedPreview.src = compressedDataUrl;

    // 计算压缩后的大小
    const compressedBytes = Math.round(
      ((compressedDataUrl.length - "data:image/jpeg;base64,".length) * 3) / 4
    );
    compressedSize.textContent = formatFileSize(compressedBytes);
  };
  img.src = imageData;
}

// 事件监听：点击上传
uploadArea.addEventListener("click", () => {
  imageInput.click();
});

// 事件监听：文件选择
imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    handleImageUpload(file);
  }
});

// 事件监听：拖拽上传
uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) {
    handleImageUpload(file);
  }
});

// 事件监听：质量调节
quality.addEventListener("input", () => {
  qualityValue.textContent = quality.value + "%";
  if (originalPreview.src) {
    compressImage(originalPreview.src);
  }
});

// 事件监听：下载压缩后的图片
downloadBtn.addEventListener("click", () => {
  if (!compressedPreview.src) return;

  const link = document.createElement("a");
  link.download = "compressed-image.jpg";
  link.href = compressedPreview.src;
  link.click();
});
