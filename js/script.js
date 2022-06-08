var model;

// 載入模型
async function loadModel() {
  model = await tf.loadLayersModel('./models/model.json');
  tf.ENV.set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);//強制Tensorflow.js清理GPU記憶體。
}

//OpenCV預處理
function opencvPreprocess(imgElement) {
  try {
    let mat = cv.imread(imgElement);
    cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY, 0);
    // 二值化
    cv.threshold(mat, mat, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
    // 反色
    cv.bitwise_not(mat, mat)
    cv.imshow(imgElement.id, mat);
    mat.delete();
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
  let ctx = canvas.getContext("2d");
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
  // Javascript自動動畫效果，開啟之後每秒更新率很高，畫面流暢，但手機有可能崩潰。
  // requestAnimationFrame(() => getFrameFromVideo(video, canvas));
};

// 設置攝影機
const getCameraStream = video => {
  // 攝影機前鏡頭
  const constraints = {
    audio: false,
    video: {
      // facingMode: "user",
      facingMode: "environment"
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
  let video = document.createElement("video");
  video.id = id;
  video.width = width;
  video.height = height;
  video.autoplay = true;
  video.controls = true;
  return video;
};

//建立畫布
const createCanvas = (id, width, height) => {
  let canvas = document.createElement("canvas");
  canvas.id = id;
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const init = () => {
  let video = createVideo("vid", 480, 360);
  let canvas = createCanvas("canvas", 480, 360);
  let originImg = document.getElementById("origin-img");
  let resultImg = document.getElementById("result-img");
  loadModel()
  getCameraStream(video);
  // 每0.25秒更新1次
  window.setInterval(()=>{
    getFrameFromVideo(video, canvas)
  }, 25)
  originImg.appendChild(video);
  resultImg.appendChild(canvas);
  console.log("init");
};

init();
