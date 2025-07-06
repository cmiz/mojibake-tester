// app/api/garble/route.ts
import { NextRequest, NextResponse } from 'next/server';
import iconv from 'iconv-lite';
import { h } from '@/lib/utils'; // lib/utils.ts から h 関数をインポート

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const inputText = formData.get('text')?.toString() || '';

    if (!inputText) {
        return NextResponse.json({ error: 'テキストが入力されていません' }, { status: 400 });
    }

    const encodings = ['SJIS', 'UTF-8', 'EUC-JP', 'ISO-2022-JP'];
    const results: {
        originEncoding: string;
        originByteString: string;
        misinterprets: { wrongEncoding: string; garbledText: string }[];
    }[] = [];

    for (const originEncoding of encodings) {
        let originBuffer: Buffer;

        try {
            // 入力テキスト (仮にUTF-8とみなす) を、対象のエンコーディングのバイト列に変換
            originBuffer = iconv.encode(inputText, originEncoding);
        } catch (e: any) {
            // エンコーディングエラーが発生した場合のフォールバック
            // このケースは通常、入力テキストが対象エンコーディングで表現できない文字を含む場合に発生
            results.push({
                originEncoding: originEncoding,
                originByteString: '(変換エラー)',
                misinterprets: []
            });
            continue; // 次のエンコーディングへ
        }

        const originByteString = Array.from(originBuffer)
            .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
            .join(' ');

        const misinterprets: { wrongEncoding: string; garbledText: string }[] = [];
        for (const wrongEncoding of encodings) {
            if (originEncoding !== wrongEncoding) {
                let garbledText: string;
                try {
                    // 元のバイト列 (originBuffer) を、誤ったエンコーディングとしてデコード
                    garbledText = iconv.decode(originBuffer, wrongEncoding);
                } catch (e) {
                    garbledText = `(デコードエラー: ${wrongEncoding})`;
                }
                misinterprets.push({
                    wrongEncoding: wrongEncoding,
                    garbledText: garbledText
                });
            }
        }

        results.push({
            originEncoding: originEncoding,
            originByteString: originByteString,
            misinterprets: misinterprets
        });
    }

    // JSON形式で結果を返す
    return NextResponse.json({ originalText: inputText, results: results });
}