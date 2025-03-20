// 全局变量
const state = {
  images: new Map(), // 存储所有图片信息
  processedCount: 0,
  totalCount: 0,
  quality: 80,
};

// DOM 元素
const uploadArea = document.getElementById("uploadArea");
const imageInput = document.getElementById("imageInput");
const imageList = document.getElementById("imageList");
const imageGrid = document.getElementById("imageGrid");
const batchProgress = document.getElementById("batchProgress");
const progressFill = document.getElementById("progressFill");
const processedCount = document.getElementById("processedCount");
const totalCount = document.getElementById("totalCount");
const quality = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");
const compressAllBtn = document.getElementById("compressAllBtn");
const downloadAllBtn = document.getElementById("downloadAllBtn");
const compressionStats = document.getElementById("compressionStats");
const totalCompressionRate = document.getElementById("totalCompressionRate");
const savedSpace = document.getElementById("savedSpace");

// 工具函数：格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// 创建图片项
function createImageItem(file, index) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const imageItem = document.createElement("div");
    imageItem.className = "image-item";
    imageItem.dataset.index = index;

    const preview = document.createElement("img");
    preview.className = "image-item-preview";
    preview.src = e.target.result;
    preview.alt = file.name;

    const info = document.createElement("div");
    info.className = "image-item-info";
    info.innerHTML = `
            <div class="image-item-name">${file.name}</div>
            <div class="image-item-size">
                <span>原始大小: ${formatFileSize(file.size)}</span>
                <span class="compressed-size">压缩后: -</span>
            </div>
        `;

    const actions = document.createElement("div");
    actions.className = "image-item-actions";
    actions.innerHTML = `
            <button class="item-action-btn compress-btn" title="压缩">
                <svg viewBox="0 0 24 24">
                    <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                </svg>
            </button>
            <button class="item-action-btn download-btn" title="下载" style="display: none;">
                <svg viewBox="0 0 24 24">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
            </button>
        `;

    imageItem.appendChild(preview);
    imageItem.appendChild(info);
    imageItem.appendChild(actions);
    imageGrid.appendChild(imageItem);

    // 存储图片信息
    state.images.set(index, {
      file,
      element: imageItem,
      originalSize: file.size,
      compressedSize: 0,
      compressed: false,
      compressedData: null,
    });

    // 绑定单个图片的压缩和下载事件
    const compressBtn = actions.querySelector(".compress-btn");
    const downloadBtn = actions.querySelector(".download-btn");

    compressBtn.addEventListener("click", () => compressImage(index));
    downloadBtn.addEventListener("click", () => downloadImage(index));
  };
  reader.readAsDataURL(file);
}

// 处理图片上传
function handleImageUpload(files) {
  // 重置状态
  state.images.clear();
  state.processedCount = 0;
  state.totalCount = files.length;
  imageGrid.innerHTML = "";

  // 更新UI
  imageList.hidden = false;
  batchProgress.hidden = true;
  downloadAllBtn.disabled = true;
  compressionStats.hidden = true;

  // 创建图片项
  Array.from(files).forEach((file, index) => {
    if (file.type.match("image.*")) {
      createImageItem(file, index);
    }
  });

  // 更新计数
  updateProgress();
}

// 压缩单个图片
async function compressImage(index) {
  const imageInfo = state.images.get(index);
  if (!imageInfo || imageInfo.compressed) return;

  const img = new Image();
  img.src = URL.createObjectURL(imageInfo.file);

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const compressedDataUrl = canvas.toDataURL(
      "image/jpeg",
      state.quality / 100
    );
    const compressedSize = Math.round(
      ((compressedDataUrl.length - "data:image/jpeg;base64,".length) * 3) / 4
    );

    // 更新图片信息
    imageInfo.compressed = true;
    imageInfo.compressedSize = compressedSize;
    imageInfo.compressedData = compressedDataUrl;

    // 更新UI
    const sizeInfo = imageInfo.element.querySelector(".compressed-size");
    sizeInfo.textContent = `压缩后: ${formatFileSize(compressedSize)}`;

    const downloadBtn = imageInfo.element.querySelector(".download-btn");
    downloadBtn.style.display = "flex";

    // 更新进度
    state.processedCount++;
    updateProgress();
    updateCompressionStats();

    URL.revokeObjectURL(img.src);
  };
}

// 压缩所有图片
async function compressAllImages() {
  batchProgress.hidden = false;

  for (const [index] of state.images) {
    await compressImage(index);
  }

  downloadAllBtn.disabled = false;
}

// 下载单个图片
function downloadImage(index) {
  const imageInfo = state.images.get(index);
  if (!imageInfo || !imageInfo.compressed) return;

  const link = document.createElement("a");
  link.download = `compressed_${imageInfo.file.name}`;
  link.href = imageInfo.compressedData;
  link.click();
}

// 下载所有压缩后的图片
function downloadAllImages() {
  for (const [index] of state.images) {
    downloadImage(index);
  }
}

// 更新进度显示
function updateProgress() {
  const progress = (state.processedCount / state.totalCount) * 100;
  progressFill.style.width = `${progress}%`;
  processedCount.textContent = state.processedCount;
  totalCount.textContent = state.totalCount;
}

// 更新压缩统计信息
function updateCompressionStats() {
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;

  for (const [, imageInfo] of state.images) {
    if (imageInfo.compressed) {
      totalOriginalSize += imageInfo.originalSize;
      totalCompressedSize += imageInfo.compressedSize;
    }
  }

  const compressionRate = (
    ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) *
    100
  ).toFixed(1);
  const spaceSaved = totalOriginalSize - totalCompressedSize;

  totalCompressionRate.textContent = `${compressionRate}%`;
  savedSpace.textContent = formatFileSize(spaceSaved);
  compressionStats.hidden = false;
}

// 事件监听：点击上传
uploadArea.addEventListener("click", () => {
  imageInput.click();
});

// 事件监听：文件选择
imageInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    handleImageUpload(e.target.files);
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
  if (e.dataTransfer.files.length > 0) {
    handleImageUpload(e.dataTransfer.files);
  }
});

// 事件监听：质量调节
quality.addEventListener("input", () => {
  state.quality = quality.value;
  qualityValue.textContent = `${quality.value}%`;
});

// 事件监听：批量操作按钮
compressAllBtn.addEventListener("click", compressAllImages);
downloadAllBtn.addEventListener("click", downloadAllImages);
