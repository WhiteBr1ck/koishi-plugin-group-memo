import { Context, Schema, Logger } from 'koishi'

export const name = 'group-memo'
export const using = ['database']

const logger = new Logger(name)

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface GroupMemo {
  id: number
  content: string
  channelId: string
  createdAt: Date
}

declare module 'koishi' {
  interface Tables {
    group_memo: GroupMemo
  }
}

export interface Config {
  sendMode: 'merge' | 'separate'
  showListAfterUpdate: boolean
  debug: boolean
}

export const Config: Schema<Config> = Schema.object({
  sendMode: Schema.union(['merge', 'separate'])
    .description('选择备忘录的发送方式。<br>- **合并发送 (merge):** 速度快，将所有备忘录合并为一条消息发送。但当包含失效图片/文件时，**可能导致整条消息发送失败**。<br>- **分离发送 (separate):** 逐条发送，速度稍慢但非常稳定，即使某条失败也不会影响其他条目。**强烈推荐使用此模式**。')
    .default('separate'),
  showListAfterUpdate: Schema.boolean()
    .description('在添加或删除备忘录后，是否自动显示最新的备忘录列表。')
    .default(true),
  debug: Schema.boolean()
    .description('启用调试模式。启用后，插件的详细操作日志将在控制台输出，方便开发者或管理员排查问题。')
    .default(false),
})

export function apply(ctx: Context, config: Config) {
  ctx.model.extend('group_memo', {
    id: 'unsigned',
    content: 'text',
    channelId: 'string',
    createdAt: 'timestamp',
  }, {
    autoInc: true,
  })

  const viewCommand = ctx.command('群备忘录', '查看当前的备忘录')
    .action(async ({ session }) => {
      if (config.debug) {
        logger.info(`[View] Fetching memos for channel: ${session.cid}`)
      }
      const memos = await ctx.database.get('group_memo', { channelId: session.cid }, {
        sort: { createdAt: 'asc' }
      })

      if (memos.length === 0) {
        return '本群备忘录是空的，使用“群备忘录添加”来记录第一条吧！'
      }

      const header = '📝 --- 群备忘录 --- 📝'

      if (config.sendMode === 'separate') {
        await session.send(header)
        await sleep(200)
        
        for (const [index, item] of memos.entries()) {
          const numberLabel = `【${index + 1}】`
          try {
            await session.send(`${numberLabel} ${item.content}`)
          } catch (error) {
            await session.send(`${numberLabel} [此条备忘录因包含过期或无效的媒体文件而无法发送]`)
            if (config.debug) {
              logger.warn(`Failed to send memo (ID: ${item.id}) in channel ${session.cid}. Reason:`)
              logger.warn(error)
            }
          }
          await sleep(200)
        }
        return
      } else {
        const output = memos.map((item, index) => {
          const numberLabel = `【${index + 1}】`
          return `${numberLabel} ${item.content}`
        }).join('\n')
        
        return `${header}\n${output}`
      }
    })

  ctx.command('群备忘录添加 <content:text>', '添加一条新的备忘录')
    .action(async ({ session }, content) => {
      if (!content || content.trim() === '') {
        return '请输入要添加的内容。'
      }
      if (config.debug) {
        logger.info(`[Add] Creating memo in channel ${session.cid} with raw content: "${content}"`)
      }
      await ctx.database.create('group_memo', {
        content,
        channelId: session.cid,
        createdAt: new Date(),
      })
      await session.send('备忘录添加成功！')
      if (config.showListAfterUpdate) {
        return viewCommand.execute({ session })
      }
    })

  ctx.command('群备忘录删除 <index:number>', '删除指定序号的备忘录')
    .action(async ({ session }, index) => {
      if (!index) return '请输入要删除的备忘录序号。'
      const memos = await ctx.database.get('group_memo', { channelId: session.cid }, { sort: { createdAt: 'asc' } })
      if (index <= 0 || index > memos.length) {
        return `序号 ${index} 无效，请输入 1 到 ${memos.length} 之间的数字。`
      }
      const targetMemo = memos[index - 1]
      if (config.debug) {
        logger.info(`[Delete] Removing memo (ID: ${targetMemo.id}) from channel ${session.cid}`)
      }
      await ctx.database.remove('group_memo', { id: targetMemo.id })
      await session.send(`序号为 ${index} 的备忘录已删除。`)
      if (config.showListAfterUpdate) {
        return viewCommand.execute({ session })
      }
    })

  ctx.command('群备忘录提取 <index:number>', '提取并单独发送一条指定的备忘录')
    .action(async ({ session }, index) => {
      if (!index) {
        return '请输入要提取的备忘录序号。'
      }
      const memos = await ctx.database.get('group_memo', { channelId: session.cid }, {
        sort: { createdAt: 'asc' }
      })
      if (index <= 0 || index > memos.length) {
        return `序号 ${index} 无效，请输入 1 到 ${memos.length} 之间的数字。`
      }
      const targetMemo = memos[index - 1]
      if (config.debug) {
        logger.info(`[Extract] Extracting memo (ID: ${targetMemo.id}) for channel ${session.cid}`)
      }
      return targetMemo.content
    })

  ctx.command('群备忘录清空', '清空当前群组的所有备忘录')
    .action(async ({ session }) => {
      await session.send('⚠️ 警告：此操作将删除本群的所有备忘录，且不可恢复。\n请在 30 秒内回复“确认”以继续。')
      const confirmation = await session.prompt(30 * 1000)
      if (!confirmation || confirmation.trim() !== '确认') {
        return '操作已取消。'
      }
      if (config.debug) {
        logger.info(`[Clear] Clearing all memos for channel: ${session.cid}`)
      }
      await ctx.database.remove('group_memo', { channelId: session.cid })
      return '本群备忘录已成功清空。'
    })
}