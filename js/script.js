//record gait data and make json file
var bles = [new Orphe(0), new Orphe(1)];

var accs = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
];
var gyros = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
];

var gaits = [
  {
    type: 0,
    vation: 0,
    calorie: 0,
    distance: 0,
    steps: 0,
    standing_phase_duration: 0,
    swing_phase_duration: 0,
  },
  {
    type: 0,
    direction: 0,
    calorie: 0,
    distance: 0,
    steps: 0,
    standing_phase_duration: 0,
    swing_phase_duration: 0,
  },
];
var strides = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
];
var stride_length = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
];
var ave_stride_length = [0, 0];

var foot_angles = [0, 0];
var pronations = [
  { landing_impact: 0, x: 0, y: 0, z: 0 },
  { landing_impact: 0, x: 0, y: 0, z: 0 },
];
//duration, cadence, pace, speed
var duration = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
];
var cadence = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
];
var pace = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
];
var speed = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
];
var ave_duration = [0, 0];
var ave_cadence = [0, 0];
var ave_pace = [0, 0];
var ave_speed = [0, 0];

//about recording
var isRecording = false;
var recordingStartTime;
var recordData = [];
var recordingStartTime = 0;
var recordingDuration = 30 * 1000; // 30 seconds in milliseconds
var recordButton; //recording toggle button
var gateArray = [];
var walking_cycles = { left: [], right: [] }

function setup() {
  // ORPHE CORE Init
  for (ble of bles) {
    ble.setup();
    ble.gotGait = function (_gait) {
      gaits[this.id] = _gait;
      updateMetrics(this.id, _gait);
    };
    ble.gotStride = function (_stride) {
      strides[this.id] = _stride;
      updateStrideLength(this.id, _stride);
    };
    ble.gotFootAngle = function (_foot_angle) {
      foot_angles[this.id] = _foot_angle.value;
    };
    ble.gotPronation = function (_pronation) {
      pronations[this.id] = _pronation;
    };
    ble.gotAcc = function (_acc) {
      accs[this.id] = _acc;
      updateAcc(this.id, _acc);
    };
    ble.gotGyro = function (_gyro) {
      gyros[this.id] = _gyro;
      updateGyro(this.id, _gyro);
    };
  }
  createCanvas(800, 600);

  recordButton = createButton("Start Recording");
  recordButton.mousePressed(toggleRecording);
}

function draw() {
  background(200);

  for (let i = 0; i < 2; i++) {
    let xOffset = i * 400;
    text(`Acc X: ${accs[i].x}`, 220 + xOffset, 20);
    text(`Acc Y: ${accs[i].y}`, 220 + xOffset, 40);
    text(`Acc Z: ${accs[i].z}`, 220 + xOffset, 60);
    text(`Gyro X: ${gyros[i].x}`, 220 + xOffset, 80);
    text(`Gyro Y: ${gyros[i].y}`, 220 + xOffset, 100);
    text(`Gyro Z: ${gyros[i].z}`, 220 + xOffset, 120);


    text(`Type: ${gaits[i].type}`, 20 + xOffset, 20);
    text(`Direction: ${gaits[i].direction}`, 20 + xOffset, 40);
    text(`Calorie: ${gaits[i].calorie}`, 20 + xOffset, 60);
    text(`Distance: ${gaits[i].distance}`, 20 + xOffset, 80);
    text(`Steps: ${gaits[i].steps}`, 20 + xOffset, 100);
    text(
      `Standing Phase Duration: ${gaits[i].standing_phase_duration}`,
      20 + xOffset,
      120
    );
    text(
      `Swing Phase Duration: ${gaits[i].swing_phase_duration}`,
      20 + xOffset,
      140
    );
    text(`Foot Angle: ${foot_angles[i]}`, 20 + xOffset, 160);
    text(`Stride X: ${strides[i].x}`, 20 + xOffset, 180);
    text(`Stride Y: ${strides[i].y}`, 20 + xOffset, 200);
    text(`Stride Z: ${strides[i].z}`, 20 + xOffset, 220);
    text(`Landing Impact: ${pronations[i].landing_impact}`, 20 + xOffset, 240);
    text(`Pronation X: ${pronations[i].x}`, 20 + xOffset, 260);
    text(`Pronation Y: ${pronations[i].y}`, 20 + xOffset, 280);
    text(`Pronation Z: ${pronations[i].z}`, 20 + xOffset, 300);
    text(`Duration: ${ave_duration[i].toFixed(3)}`, 20 + xOffset, 320);
    text(`Cadence: ${ave_cadence[i].toFixed(3)}`, 20 + xOffset, 340);
    text(`Pace: ${ave_pace[i].toFixed(3)}`, 20 + xOffset, 360);
    text(`Speed: ${ave_speed[i].toFixed(3)}`, 20 + xOffset, 380);
  }

  if (isRecording) {
    let elapsedTime = Date.now() - recordingStartTime;
    let remainingTime = Math.max(recordingDuration - elapsedTime, 0);
    let remainingTimeSeconds = (remainingTime / 1000).toFixed(1);
    text("Recording Timer: " + remainingTimeSeconds + "s", 20, height - 30);
    if (remainingTime <= 0) {
      stopRecording();
    }
  }
}

function updateAcc(id, acc) {
  if (isRecording) {
    let recordItem = {
      timestamp: new Date().toISOString(),
      sensorId: id,
      acc: acc
    };
    let existingItemIndex = recordData.findIndex(item => item.timestamp === recordItem.timestamp && item.sensorId === recordItem.sensorId);
    if (existingItemIndex > -1) {
      // If a record for the same timestamp and sensor already exists, update it
      recordData[existingItemIndex] = { ...recordData[existingItemIndex], ...recordItem };
    } else {
      // If no record exists for this timestamp and sensor, add a new one
      recordData.push(recordItem);
    }
    //console.warn("isRecording updateAcc", recordData)
  }
}

function updateGyro(id, gyro) {
  if (isRecording) {
    let recordItem = {
      timestamp: new Date().toISOString(),
      sensorId: id,
      gyro: gyro
    };
    let existingItemIndex = recordData.findIndex(item => item.timestamp === recordItem.timestamp && item.sensorId === recordItem.sensorId);
    if (existingItemIndex > -1) {
      // If a record for the same timestamp and sensor already exists, update it
      recordData[existingItemIndex] = { ...recordData[existingItemIndex], ...recordItem };
    } else {
      // If no record exists for this timestamp and sensor, add a new one
      recordData.push(recordItem);
    }
  }
}

function updateMetrics(id, gait) {//duration,cadence,pace,speedを計算
  if (gait.swing_phase_duration > 0.0 && gait.standing_phase_duration > 0.0) {
    duration[id].unshift(
      gait.swing_phase_duration + gait.standing_phase_duration
    );
    if (duration[id].length > 5) {
      duration[id].pop();
    }
    ave_duration[id] =
      duration[id].reduce((a, b) => a + b) / duration[id].length;

    cadence[id].unshift(
      1 / (gait.swing_phase_duration + gait.standing_phase_duration)
    );
    if (cadence[id].length > 5) {
      cadence[id].pop();
    }
    ave_cadence[id] = cadence[id].reduce((a, b) => a + b) / cadence[id].length;

    pace[id].unshift(ave_duration[id] / ave_stride_length[id]);
    if (pace[id].length > 5) {
      pace[id].pop();
    }
    ave_pace[id] = pace[id].reduce((a, b) => a + b) / pace[id].length;

    speed[id].unshift((3.6 * 1) / pace[id][0]);
    if (speed[id].length > 5) {
      speed[id].pop();
    }
    ave_speed[id] = speed[id].reduce((a, b) => a + b) / speed[id].length;

    if (isRecording) {
      const walking_cycle = gait.standing_phase_duration + gait.swing_phase_duration;
      const datasetKey = id === 0 ? "left" : "right";

      walking_cycles[datasetKey].push(walking_cycle);
      const dataset = walking_cycles[datasetKey];

      var { stride_time_cv, average, standardDeviation } = calculateStrideCv(dataset);

      var timestamp = new Date().toISOString()

      recordData.push({
        timestamp: timestamp,
        Left0_or_Right1: id,
        gait: gateArray[timestamp],
        gait_calorie: gait.calorie,
        gait_direction: gait.direction,
        gait_distance: gait.distance,
        gait_standing_phase_duration: gait.standing_phase_duration,
        gait_steps: gait.steps,
        gait_swing_phase_duration: gait.swing_phase_duration,
        gait_type: gait.type,
        duration_sec: ave_duration[id],
        cadence_per_sec: ave_cadence[id],
        pace_sec_per_meter: ave_pace[id],
        speed_km_per_hour: ave_speed[id],
        // 平均ストライド
        ave_stride_length: ave_stride_length[id],
        // ストライドCV
        stride_time_cv: stride_time_cv,
        // 歩行周期の平均
        average: average,
        // 歩行周期の標準偏差
        standard_deviation: standardDeviation,
      });
    }
  }
}


function calculateStrideCv(dataset) {
  const sum = dataset.reduce((a, b) => a + b, 0);
  const average = sum / dataset.length;

  const deviation = dataset.map((a) => (a - average) ** 2);
  const deviationSum = deviation.reduce((a, b) => a + b, 0);
  const variance = deviationSum / (dataset.length - 1);
  const standardDeviation = Math.sqrt(variance);

  const stride_time_cv = (standardDeviation / average) * 100;

  return { stride_time_cv, average, standardDeviation };
}


function calculateStrideTimeCv(walking_cycle_array) {
  var average = math.mean(walking_cycle_array);
  // 歩行周期時間の標準偏差
  var standardDeviation = math.std(walking_cycle_array);

  // ストライドCV [%] = (歩行周期時間の標準偏差 / 歩行周期時間の平均値) × 100
  var stride_time_cv = (standardDeviation / average) * 100;
  return stride_time_cv;
}

//3軸のstrideデータから歩幅strideを計算
function updateStrideLength(id, stride) {
  // stride = sqrt(strideX * strideX + strideY * strideY + strideZ * strideZ)
  stride_length[id][0] = Math.sqrt(
    stride.x * stride.x + stride.y * stride.y + stride.z * stride.z
  );
  stride_length[id].unshift(
    stride.x * stride.x + stride.y * stride.y + stride.z * stride.z
  ); // add the value at the beginning
  // if stride_length length is greater than 5, remove the last element
  if (stride_length[id].length > 5) {
    stride_length[id].pop();
  }
  // calculate the average value
  let sum = 0;
  for (let i = 0; i < 5; i++) {
    sum += stride_length[id][i];
  }
  ave_stride_length[id] = sum / 5.0;

}

//json recording
function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording() {
  isRecording = true;
  recordingStartTime = Date.now();
  recordData = [];
  recordButton.html("Stop Recording");
}

function stopRecording() {
  isRecording = false;
  let csvContent = convertToCsv();
  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "recorded_data.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  recordButton.html("Start Recording");
  showRecordedData();
}

/**
 * OrpheCoreで取れる歩行関係のrowDataと歩行計測に必要な項目値を求めてCSVに出力するための中身を作成
 * 
 * @returns csvContent
 */
function convertToCsv() {
  let csvContent = "data:text/csv;charset=utf-8,";

  csvContent += "timestamp,Left0_or_Right1,gait_calorie,gait_direction,gait_distance,gait_standing_phase_duration,gait_steps,gait_swing_phase_duration,gait_type,speed_m_per_second,ave_stride_length,single_stance_symmetry_ratio,double_support_time,stride_time_cv,average,standard_deviation\r\n"; // header

  recordData.forEach(function (item, index) {
    let row = [];
    row.push(item.timestamp);
    row.push(item.Left0_or_Right1);
    row.push(item.gait_calorie ?? 0, item.gait_direction ?? 0, item.gait_distance ?? 0, item.gait_standing_phase_duration ?? 0, item.gait_steps ?? 0, item.gait_swing_phase_duration ?? 0, item.gait_type ?? 0);

    // No1 歩行速度(単位はm/sに変更)
    // 用語参考：https://orphe.io/column/post/report-of-gait-analyysis-evaluation#index_yAdoX4PG
    // 平均値参考：https://ihoujin.nagoya/gait-speed/
    function convertKmhToMps(kmh) {
      return kmh * (1000 / 3600); // 1 km = 1000 m, 1 h = 3600 s
    }

    row.push(convertKmhToMps(item.speed_km_per_hour));

    // No2 歩幅
    // 用語参考：https://orphe.io/column/post/report-of-gait-analyysis-evaluation#index_cxnvCUZb
    row.push(item.duration_sec);

    // No3 対称性
    // 用語参考：https://orphe.io/column/post/report-of-gait-analyysis-evaluation#index_01t7yqM_
    // 平均値参考：https://www.apple.com/jp/healthcare/docs/site/Measuring_Walking_Quality_Through_iPhone_Mobility_Metrics_JP.pdf 12ページ目
    var single_stance_symmetry_ratio = 0;
    // 一歩前のstanding時間と現在歩行時のstanding時間を比較するので最初の一歩目では計測しない
    if (index !== 0) {
      // 一歩前のstanding時間と現在歩行時のstanding時間をそれぞれ割ってみて、1以上の値となる方を対称性として使用する
      var up_down_symmetry_ratio = item.gait_standing_phase_duration / recordData[index - 1].gait_standing_phase_duration;
      var down_up_symmetry_ratio = recordData[index - 1].gait_standing_phase_duration / item.gait_standing_phase_duration;
      single_stance_symmetry_ratio = up_down_symmetry_ratio >= 1 ? up_down_symmetry_ratio : down_up_symmetry_ratio;
    }
    row.push(single_stance_symmetry_ratio);

    // No4 両脚支持期
    // 用語参考1：https://orphe.io/column/post/report-of-gait-analyysis-evaluation#index_V2EiLSBf
    // 用語参考2：https://orphe.io/column/post/basic-knowledge-of-walking-motion#index_oncO9_4r
    // 平均値参考：https://www.apple.com/jp/healthcare/docs/site/Measuring_Walking_Quality_Through_iPhone_Mobility_Metrics_JP.pdf 11ページ目
    var double_support_time = 0;
    // gait_standing_phase_duration - 一歩前のgait_swing_phase_duration = DoubleSupportPhase
    if (index > 0) {
      double_support_time = recordData[index].gait_standing_phase_duration - recordData[index - 1].gait_swing_phase_duration
    }
    row.push(double_support_time);

    // No5 ストライドCV
    // 用語参考：https://orphe.io/column/post/report-of-gait-analyysis-evaluation#index_6apv3f6Y
    // 値参考：https://orphe.io/column/post/report-of-gait-analyysis-evaluation#index_6apv3f6Y
    row.push(item.stride_time_cv);

    row.push(item.average);
    row.push(item.standard_deviation);

    csvContent += row.join(",") + "\r\n";
  });
  return csvContent;
}

function downloadJson(jsonData, filename) {
  let dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(jsonData);
  let link = document.createElement("a");
  link.setAttribute("href", dataUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

//recordDataをcanvasの下に描画する
function showRecordedData() {
  let recordDataText = createP("Recorded Data:");
  recordDataText.style("font-weight", "bold");

  for (let data of recordData) {
    let dataText = createP(JSON.stringify(data, null, 2));
    dataText.style("white-space", "pre-wrap");
  }
}