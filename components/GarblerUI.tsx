// components/GarblerUI.tsx
'use client'; // これがClient Componentであることを示す必須ディレクティブ

import { useState, useEffect, useRef } from 'react';
import { h } from '@/lib/utils'; // lib/utils.ts から h 関数をインポート

// APIから返されるデータの型定義
interface MisinterpretResult {
    wrongEncoding: string;
    garbledText: string;
}

interface EncodingResult {
    originEncoding: string;
    originByteString: string;
    misinterprets: MisinterpretResult[];
}

interface GarbleApiResponse {
    originalText: string;
    results: EncodingResult[];
}

export default function GarblerUI() {
    const [inputText, setInputText] = useState('このテキストを文字化けさせます');
    const [garbleResults, setGarbleResults] = useState<EncodingResult[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const inputTimerRef = useRef<NodeJS.Timeout | null>(null);
    const currentRequestId = useRef<number>(0); // 最新のリクエストを追跡

    const fetchGarbledData = async () => {
        setIsLoading(true);
        setError(null);
        const thisRequestId = ++currentRequestId.current; // 新しいリクエストIDを生成

        const formData = new FormData();
        formData.append('text', inputText.trim());

        try {
            const resp = await fetch('/api/garble', {
                method: 'POST',
                body: formData,
            });

            if (!resp.ok) {
                const errorData = await resp.json();
                throw new Error(errorData.error || `HTTPエラー: ${resp.status}`);
            }

            const data: GarbleApiResponse = await resp.json();

            // 最新のリクエストIDと一致する場合のみ状態を更新
            if (thisRequestId === currentRequestId.current) {
                setGarbleResults(data.results);
            }
        } catch (err: any) {
            if (thisRequestId === currentRequestId.current) {
                setError('データの取得中にエラーが発生しました: ' + err.message);
                setGarbleResults([]); // エラー時は結果をクリア
            }
        } finally {
            if (thisRequestId === currentRequestId.current) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        // 初期ロード時とinputTextが変更されたときにデータをフェッチ
        if (inputTimerRef.current) {
            clearTimeout(inputTimerRef.current);
        }
        // debounce: 入力後150ms待ってからAPI呼び出し
        inputTimerRef.current = setTimeout(fetchGarbledData, 150);

        return () => {
            if (inputTimerRef.current) {
                clearTimeout(inputTimerRef.current);
            }
        };
    }, [inputText]); // inputText の変更を監視

    const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value);
        // テキストエリアの高さ自動調整
        e.target.style.height = "auto";
        e.target.style.height = 2 + e.target.scrollHeight + "px";
    };

    return (
        <>
            <textarea
                placeholder="日本語テキストを入力してください"
                value={inputText}
                onChange={handleTextareaInput}
                rows={5} // 初期行数、自動調整される
                className="w-full p-2 text-lg font-sans box-border resize-y" // Tailwind CSS クラス
            />

            <div className="arrowDown"></div>

            {error && <div className="text-red-500 mt-4 p-2 border border-red-300 bg-red-50">{error}</div>}

            <div className={isLoading ? 'loading' : ''}>
                {garbleResults.length > 0 ? (
                    garbleResults.map((result, index) => (
                        <div className="result" key={index}>
                            <div className="originEncoding"><b>{h(result.originEncoding)}</b> のバイト列を</div>
                            <div className="originByteString">{h(result.originByteString)}</div>
                            <div className="misinterprets">
                                {result.misinterprets.map((misinterpret, subIndex) => (
                                    <div className="misinterprets" key={subIndex}>
                                        <div className="wrongEncoding">┗ <b>{h(misinterpret.wrongEncoding)}</b> として誤解釈すると</div>
                                        <div className="garbledText">{misinterpret.garbledText.split('\n').map((line, lineIndex) => <span key={lineIndex}>{h(line)}<br /></span>)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    !isLoading && !error && <div className="text-center text-gray-500">テキストを入力して文字化け結果を確認してください。</div>
                )}
            </div>
        </>
    );
}