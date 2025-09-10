import axios from "axios"
import { getDateString, getDateTimeString } from "./time.js"
import { appendFileSync } from "./fileUtil.js"


async function getPlaybackData(programId) {
  const date = new Date()
  const today = getDateString(date)
  const resp = await axios.get(`https://program-sc.miguvideo.com/live/v2/tv-programs-data/${programId}/${today}`).then(r => r.data)
  return resp.body?.program[0]?.content
}

async function updatePlaybackData(program, filePath) {
  // 今日节目数据
  const playbackData = await getPlaybackData(program.pID)
  if (!playbackData) {
    return false
  }
  // 写入频道信息
  appendFileSync(filePath,
    `    <channel id="${program.name}">\n` +
    `        <display-name lang="zh">${program.name}</display-name>\n` +
    `    </channel>\n`
  )

  // 写入节目信息
  for (let i = 0; i < playbackData.length; i++) {
    appendFileSync(filePath,
      `    <programme channel="${program.name}" start="${getDateTimeString(new Date(playbackData[i].startTime))} +0800" stop="${getDateTimeString(new Date(playbackData[i].endTime))} +0800">\n` +
      `        <title lang="zh">${playbackData[i].contName}</title>\n` +
      `    </programme>\n`
    )
  }
  return true
}
export { updatePlaybackData }

