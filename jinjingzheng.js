// 配置项
const API = "自行抓包" + "/pro/applyRecordController/stateList";
const AUTH = "自行抓包 Authorization";
const CAR = "汽车图片链接自行查找";

// 屏幕组件刷新频率由系统控制，为防止刷新过于频繁，设置为每天仅执行一次
let exeKey = "jjzLastExecutionDate";
if (!Keychain.contains(exeKey)) {
  Keychain.set(exeKey, "null");
}
let lastExecutionDate = Keychain.get(exeKey);
const currentDate = new Date().toLocaleDateString(); // 2024/1/23
if (lastExecutionDate === currentDate) {
  console.log("今天已经执行过脚本，无需再次执行！");
} else {
  // main
  var data = await getData(API, AUTH);
  let widget = await createWidget(data);

  if (!config.runsInWidget) {
    await widget.presentMedium();
  }
  Script.setWidget(widget);
  Script.complete();

  Keychain.set(exeKey, currentDate);
}

async function createWidget(data) {
  let w = new ListWidget();
  w.setPadding(10, 10, 5, 10);
  bg = new LinearGradient();
  bg.locations = [0, 1];
  bg.colors = [new Color("#000000", 1), new Color("#A0A0A0", 1)];
  w.backgroundGradient = bg; 

  const wrap = w.addStack();
  wrap.layoutHorizontally();
  wrap.spacing = 15;

  // --> 左侧垂直
  const left = wrap.addStack();
  left.layoutVertically();

  // 标题
  let TypeStack = left.addStack();
  TypeStack.layoutVertically();
  const TypeStatusLabel = TypeStack.addText(
    data.data.bzclxx[0].bzxx[0].jjzzlmc
  );
  TypeStatusLabel.font = Font.semiboldSystemFont(20);
  TypeStatusLabel.textColor = Color.white();
  TypeStack.addSpacer(10);

  // 基本信息
  let PeriodValidityStack = left.addStack();
  PeriodValidityStack.layoutVertically();
  let labelsData = [
    { text: "⏺ 申请: " + data.data.bzclxx[0].bzxx[0].sqsj.split(" ")[0], highlight: false },
    { text: "🔄 状态: " + data.data.bzclxx[0].bzxx[0].blztmc, highlight: true },
    { text: "✅ 生效: " + data.data.bzclxx[0].bzxx[0].yxqs, highlight: false },
    { text: "🛑 截止: " + data.data.bzclxx[0].bzxx[0].yxqz, highlight: false },
    { text: "🅿️ 车牌: " + data.data.bzclxx[0].hphm, highlight: false },
    { text: "🌈 剩余: " + data.data.bzclxx[0].sycs + " 次（" + data.data.bzclxx[0].syts + "天）", highlight: false },
  ];
  for (let labelData of labelsData) {
    let labelStack = PeriodValidityStack.addStack();
    let labelText = labelStack.addText(labelData.text);
    labelText.font = Font.boldSystemFont(12);
    labelText.textColor = new Color("#C5CDD4", 1);
    if (labelData.highlight) {
      labelStack.backgroundColor = new Color("#007BFF", 0.3);
    }
    PeriodValidityStack.addSpacer(5);
  }

  // --> 右侧垂直
  const right = wrap.addStack();
  right.layoutVertically();

  // 限行日
  let LimitStack = right.addStack();
  LimitStack.addSpacer(10); // 设置上方的间距
  LimitStack.layoutVertically();
  let LimitWeekday = await getLimitWeekday();
  let yxqz = getDayOfWeek(data.data.bzclxx[0].bzxx[0].yxqz); // 证件到期日
  let LimitLabel = LimitStack.addText(
    "  🛑 " +
      yxqz +
      "   🚫 " +
      LimitWeekday +
      "\n  🔈 更新于: " +
      getCurrentFormattedTime()
  );
  LimitLabel.font = Font.regularSystemFont(13);
  LimitLabel.textColor = Color.red();

  // 图片信息
  let CarStack = right.addStack();
  CarStack.setPadding(10, 10, 0, 0);
  const icon = await getImage(CAR);
  const iconImg = CarStack.addImage(icon);
  iconImg.cornerRadius = 10; // 设置图片圆角
  iconImg.shadowRadius = 5; // 设置阴影的模糊半径
  iconImg.shadowColor = Color.black(); // 设置阴影颜色
  iconImg.shadowOpacity = 0.8; // 设置阴影透明度
  iconImg.imageOpacity = 0.8; // 设置图片透明度

  return w;
}

async function getImage(url) {
  let req = new Request(url);
  return await req.loadImage();
}

async function getData(url, auth) {
  let req = new Request(url);
  req.method = "post";
  req.headers = {
    "Content-Type": "application/json;charset=UTF-8",
    Authorization: auth,
  };
  var data = await req.loadJSON();
  return data;
}

async function getLimitWeekday() {
  let myNumber = data.data.bzclxx[0].hphm;
  let num = myNumber.charAt(myNumber.length - 1); // 尾号

  let req = new Request("https://banshi.beijing.gov.cn/zwfwapi/jgj/getRule");
  req.method = "GET";
  var resp = await req.loadJSON();
  var jsonObject = JSON.parse(resp.data);

  let limitWeekday;
  for (let item of jsonObject.result) {
    if (item.limitedNumber.includes(num)) {
      limitWeekday = item.limitedWeek;
      break;
    }
  }
  console.log("\n车牌尾号为 " + num + " 的限行日是: " + limitWeekday);
  return limitWeekday;
}

function getDayOfWeek(dateString) {
  const dateObject = new Date(dateString);
  const options = { weekday: "long", timeZone: "UTC" };
  const dayOfWeek = dateObject.toLocaleDateString("zh-CN", options);
  return dayOfWeek;
}

function getCurrentFormattedTime() {
  let now = new Date();
  let month = (now.getMonth() + 1).toString().padStart(2, "0");
  let day = now.getDate().toString().padStart(2, "0");
  let hours = now.getHours().toString().padStart(2, "0");
  let minutes = now.getMinutes().toString().padStart(2, "0");
  // 格式化：01/23 08:23
  let formattedTime = `${month}/${day} ${hours}:${minutes}`;
  return formattedTime;
}
