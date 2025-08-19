import { Context, Schema, Logger } from 'koishi'

export const name = 'group-memo'

// 核心依赖：数据库服务
export const using = ['database']

// 创建一个独立的 Logger 实例
const logger = new Logger(name)

// 定义 GroupMemo 数据表的接口
export interface GroupMemo {
  id: number
  content: string
  channelId: string
  createdAt: Date
}

// 模块扩展
declare module 'koishi' {
  interface Tables {
    group_memo: GroupMemo
  }
}

// 定义插件的配置项接口
export interface Config {
  debug: boolean
}

// 使用 Schema 定义配置项
export const Config: Schema<Config> = Schema.object({
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

  // 1. “查看备忘录”指令
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

      const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
      const output = memos.map((item, index) => {
        const numberLabel = index < 10 ? numberEmojis[index] : `${index + 1}.`
        return `${numberLabel} ${item.content}`
      }).join('\n')
      
      return `--- 群备忘录 ---\n${output}`
    })

  // 2. “添加备忘录”指令
  ctx.command('群备忘录添加 <content:text>', '添加一条新的备忘录')
    .action(async ({ session }, content) => {
      if (!content) return '请输入要添加的内容。'

      if (config.debug) {
        logger.info(`[Add] Creating memo in channel ${session.cid} with content: "${content}"`)
      }
      await ctx.database.create('group_memo', {
        content,
        channelId: session.cid,
        createdAt: new Date(),
      })

      await session.send('备忘录添加成功！')
      return viewCommand.execute({ session })
    })

  // 3. “删除备忘录”指令
  ctx.command('群备忘录删除 <index:number>', '删除指定序号的备忘录')
    .action(async ({ session }, index) => {
      if (!index) return '请输入要删除的备忘录序号。'
      
      const memos = await ctx.database.get('group_memo', { channelId: session.cid }, {
        sort: { createdAt: 'asc' }
      })

      if (index <= 0 || index > memos.length) {
        return `序号 ${index} 无效，请输入 1 到 ${memos.length} 之间的数字。`
      }

      const targetMemo = memos[index - 1]
      if (config.debug) {
        logger.info(`[Delete] Removing memo (ID: ${targetMemo.id}) from channel ${session.cid}`)
      }
      await ctx.database.remove('group_memo', { id: targetMemo.id })

      await session.send(`序号为 ${index} 的备忘录已删除。`)
      return viewCommand.execute({ session })
    })

  // 4. “清空备忘录”指令
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