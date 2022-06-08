//OpenCV預處理
function opencvPreprocess(imgElement) {
  try {
    let mat = cv.imread(imgElement);
    cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY, 0);
    // 二值化
    cv.threshold(mat, mat, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
    cv.imshow(imgElement.id, mat);
    mat.delete();
    ksize.delete();
    rect.delete()
  } catch (e) {
  }
};

// 將畫布轉換成[1,28,28,1]的張量
function CanvasToTensor(imgElement) {
  let tensor = tf.browser.fromPixels(imgElement)
    .resizeNearestNeighbor([28, 28])
    .mean(2)
    .expandDims(2)
    .expandDims()
    .toFloat().div(255.0);
  return tensor
}

// 導入模型預測結果
async function getPredict(tensor) {
  let resultObj = document.querySelector("#result")
  model = await tf.loadLayersModel('./models/model.json');
  let predict_result = await model.predict(tensor).data()
  let predict_array = await Array.from(predict_result)
  var max_predict = predict_array.reduce(function (a, b) {
    return Math.max(a, b);
  }, -Infinity);
  let result = predict_array.indexOf(max_predict)
  resultObj.innerHTML = result
  return predict_array.indexOf(max_predict)
}

// 設置畫布
const getFrameFromVideo = (video, canvas) => {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.drawImage(video, 0, 0, video.width, video.height);
  // OpenCV預處理
  opencvPreprocess(canvas)
  // 張量轉換
  let tensor = CanvasToTensor(canvas)
  // 預測結果
  getPredict(tensor)
  ctx.restore();
  requestAnimationFrame(() => getFrameFromVideo(video, canvas));
};

// 設置攝影機
const getCameraStream = video => {
  // 攝影機前鏡頭
  const constraints = {
    audio: false,
    video: {
      facingMode: "user"
    }
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function success(stream) {
      video.srcObject = stream;
    });
};

// 建立影片
const createVideo = (id, width, height) => {
  const video = document.createElement("video");
  video.id = id;
  video.width = width;
  video.height = height;
  video.autoplay = true;
  video.controls = true;
  return video;
};

//建立畫布
const createCanvas = (id, width, height) => {
  const canvas = document.createElement("canvas");
  canvas.id = id;
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const init = () => {
  const video = createVideo("vid", 480, 360);
  const canvas = createCanvas("canvas", 480, 360);
  const originImg = document.getElementById("origin-img");
  const resultImg =document.getElementById("result-img");
  getCameraStream(video);
  getFrameFromVideo(video, canvas);
  originImg.appendChild(video);
  resultImg.appendChild(canvas);
  console.log("init");
};

document.getElementById("app").onload = init();
