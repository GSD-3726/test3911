import { dataList } from "./utils/fetchList.js"
import { getAndroidURL } from "./utils/androidURL.js"
import refreshToken from "./utils/refreshToken.js"
import { appendFile, writeFile } from "./utils/fileUtil.js"
import { updatePlaybackData } from "./utils/playback.js"
import { delay } from "./utils/fetchList.js"

async function fetchURLByAndroid() {

  const userId = process.env.USERID
  const token = process.env.MIGU_TOKEN

  // 检查认证信息
  if (!userId || !token) {
    console.error("USERID 或 MIGU_TOKEN 未设置或无效")
    process.exit(1)
  }

  console.log(`使用认证: userId=${userId}, token=${token.substring(0, 10)}...`)

  const date = new Date()
  const start = date.getTime()

  // 必须绝对路径
  const path = process.cwd() + '/interface.txt'
  // 创建写入空内容
  writeFile(path, "")

  // 获取数据
  const datas = await dataList()

  // 回放
  const playbackFile = process.cwd() + '/playback.xml'
  writeFile(playbackFile,
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<tv generator-info-name="Tak" generator-info-url="https://github.com/develop202/migu_video/blob/main/playback.xml">\n`)

  if (!date.getHours()) {
    // 0点刷新token
    await refreshToken(userId, token) ? console.log("token刷新成功") : console.log("token刷新失败")
  }

  // 写入开头
  appendFile(path, `#EXTM3U x-tvg-url="https://ghfast.top/https://raw.githubusercontent.com/develop202/migu_video/refs/heads/main/playback.xml" catchup="append" catchup-source="&playbackbegin=\${(b)yyyyMMddHHmmss}&playbackend=\${(e)yyyyMMddHHmmss}"\n`)

  // 分类列表
  for (let i = 0; i < datas.length; i++) {
    console.log(`分类###:${datas[i].name}`)

    const data = datas[i].dataList
    // 写入节目
    for (let j = 0; j < data.length; j++) {
      console.log(`节目ID: ${data[j].pID}, 节目名称: ${data[j].name}`)
      
      const res = await updatePlaybackData(data[j], playbackFile)
      if (!res) {
        console.log(`playback.xml更新失败`)
      }

      // 获取链接 - 添加重试机制和多种清晰度尝试
      let retryCount = 0
      const maxRetries = 3
      let resObj = { url: "" }

      while (retryCount < maxRetries && !resObj.url) {
        // 尝试不同的清晰度
        const rateTypes = [3, 4, 5] // 高清、超清、蓝光
        for (let rt of rateTypes) {
          resObj = await getAndroidURL(userId, token, data[j].pID, rt)
          if (resObj.url !== "") {
            break // 如果获取到有效URL，跳出循环
          }
        }
        
        if (!resObj.url) {
          retryCount++
          console.log(`第 ${retryCount} 次重试...`)
          await delay(2000) // 等待2秒后重试
        }
      }

      if (resObj.url == "") {
        console.log(`${data[j].name}：节目调整，暂不提供服务`)
        continue
      }
      console.log(`正在写入节目:${data[j].name}`)

      // 写入节目
      appendFile(path, `#EXTINF:-1 svg-id="${data[j].name}" svg-name="${data[j].name}" tvg-logo="${data[j].pics.highResolutionH}" group-title="${datas[i].name}",${data[j].name}\n${resObj.url}\n`)
    }
  }

  appendFile(playbackFile, `</tv>\n`)
  const end = Date.now()
  console.log(`本次耗时:${(end - start) / 1000}秒`)
}

fetchURLByAndroid()
