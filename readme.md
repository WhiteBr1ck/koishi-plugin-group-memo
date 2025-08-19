# koishi-plugin-group-memo

[![npm](https://img.shields.io/npm/v/koishi-plugin-group-memo?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-group-memo)
[![license](https://img.shields.io/npm/l/koishi-plugin-group-memo?style=flat-square)](https://github.com/WhiteBr1ck/koishi-plugin-group-memo/blob/main/LICENSE)

一个为 [Koishi](https.koishi.chat) 设计的群组备忘录插件，允许在不同的聊天环境中独立记录、查看和管理备忘信息。

## ✨ 功能特性

-   **独立存储**: 每个群聊/频道的备忘录数据相互隔离。
-   **持久化**: 数据存储在数据库中，机器人重启后不会丢失。
-   **基本操作**: 支持备忘录的增、删、查、清空。
-   **调试模式**: 可选的调试模式，方便排查问题。

## 📦 安装


    通过 Koishi 插件市场或 npm 安装本插件：

    ```bash
    # 推荐：通过插件市场搜索 group-memo 进行安装

    ```

## 📝 使用说明

### 指令列表

| 指令 | 功能描述 | 示例 |
| --- | --- | --- |
| `群备忘录` | 查看当前聊天环境下的所有备忘录。 | `群备忘录` |
| `群备忘录添加 <内容>` | 添加一条新的备忘录。 | `群备忘录添加 明天下午三点开会` |
| `群备忘录删除 <序号>` | 删除指定序号的备忘录。 | `群备忘录删除 2` |
| `群备忘录清空` | 清空当前环境下的所有备忘录（需要确认）。 | `群备忘录清空` |

### 配置项

可在 Koishi 控制台的插件配置页面进行设置。

| 配置项 | 类型 | 描述 | 默认值 |
| --- | --- | --- | --- |
| `debug` | `boolean` | 启用调试模式。启用后，插件的详细操作日志将在控制台输出。 | `false` |

## 📄 许可证

本项目使用 [MIT License](https://github.com/WhiteBr1ck/koishi-plugin-group-memo/blob/main/LICENSE) 进行授权。

## ⚠️ 免责声明

1.  本插件按“原样”提供，不提供任何明示或暗示的保证。
2.  开发者不对因使用本插件或插件中的信息而导致的任何数据丢失、损坏或任何其他直接或间接的损失承担责任。
3.  用户对通过本插件存储的所有数据负全部责任。强烈建议用户定期备份重要数据。
4.  使用本插件即表示您同意并接受本免责声明的所有条款。