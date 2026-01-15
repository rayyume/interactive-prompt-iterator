import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let text = ''

    // 处理 PDF 文件
    if (file.type === 'application/pdf') {
      const pdfParse = require('pdf-parse')
      const data = await pdfParse(buffer)
      text = data.text
    }
    // 处理 DOCX 文件
    else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    }
    else {
      return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 })
    }

    return NextResponse.json({ text })
  } catch (error: any) {
    console.error('文件解析错误:', error)
    return NextResponse.json({ error: error.message || '文件解析失败' }, { status: 500 })
  }
}
