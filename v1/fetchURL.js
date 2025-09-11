import fs from "fs"
import { delay } from "./utils/fetchList.js"
import { close_browser, get_browser, get_page, get_url } from "./utils/getURL.js"
import { channelName } from "./utils/datas.js"

async function fetchURL() {
  try {
    // 必须绝对路径
    let path = process.cwd() + '/interface.txt'
    
    // 文件不存在则创建
    if (!fs.existsSync(path)) {
      fs.writeFile(path, "", error => {
        if (error) {
          throw new Error("文件创建失败")
        }
        console.log("文件创建成功")
      })
    }
    await delay(1000)

    // 备份文件
    fs.copyFile(path, path + ".bak", error => {
      if (error) {
        throw error
      }
      console.log("文件备份成功")
    })

    await delay(1000)
    fs.writeFile(path, "", error => {
      if (error) {
        throw new Error("文件清除失败")
      }
      console.log("文件清除成功")
    })
    
    // 检查 channelName 是否存在且是数组
    if (!channelName || !Array.isArray(channelName)) {
      throw new Error("channelName is undefined or not an array")
    }
    
    console.log("channelName length:", channelName.length)
    
    const datas = channelName
    let browser = await get_browser(null)
    let page = await get_page(browser)
    
    for (let i = 0; i < datas.length; i++) {
      // 检查 datas[i] 是否存在
      if (!datas[i]) {
        console.error(`datas[${i}] is undefined, skipping...`)
        continue
      }

      console.log("正在写入分类###:" + (datas[i].name || "未知分类"))
      
      // 写入分类数据
      fs.appendFile(path, (datas[i].name || "未知分类") + ",#genre#\n", error => {
        if (error) {
          console.error("写入失败:", error)
        }
      })

      let data = datas[i].dataList
      
      // 检查 data 是否存在且是数组
      if (!data || !Array.isArray(data)) {
        console.error(`dataList for ${datas[i].name || "未知分类"} is undefined or not an array, skipping...`)
        continue
      }
      
      console.log(`dataList length for ${datas[i].name}:`, data.length)
      
      for (let j = 0; j < data.length; j++) {
        // 检查 data[j] 是否存在
        if (!data[j]) {
          console.error(`data[${j}] is undefined, skipping...`)
          continue
        }
        
        console.log("正在准备节目")
        let link
        try {
          let base_link
          // 检查 data[j].pID 是否存在
          if (!data[j].pID) {
            console.error(`pID for data[${j}] is undefined, skipping...`)
            continue
          }
          
          link, base_link = await get_url(page, data[j].pID)

          if (!link && base_link && base_link.length >= 1) {
            try {
              link = await fetch(base_link, {
                method: "GET"
              }).then(res => res.text())
            } catch (fetchError) {
              console.error("Fetch error:", fetchError)
              continue
            }
          }

          if (!link) {
            console.error("Link is empty, skipping...")
            continue
          }
        } catch (error) {
          console.error("链接获取失败:", error)
          await close_browser(browser)
          throw new Error("链接获取失败")
        }
        
        console.log("正在写入节目:" + (data[j].name || "未知节目"))
        // 写入分类数据
        fs.appendFile(path, (data[j].name || "未知节目") + "," + link, error => {
          if (error) {
            console.error("写入失败:", error)
          }
        })
      }
    }
    
    await close_browser(browser)
    console.log("所有操作完成")
  } catch (error) {
    console.error("fetchURL 函数出错:", error)
    throw error
  }
}

fetchURL().catch(error => {
  console.error("脚本执行失败:", error)
  process.exit(1)
})
