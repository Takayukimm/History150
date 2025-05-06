
// SapixFlashcardApp v2 – 30‑card quizzes with 5 groups, 3‑grade feedback, built‑in CSV
// Place this file as FlashcardApp.jsx in a Vite/React + Tailwind project.
// Requires: PapaParse, lucide-react, shadcn/ui components.

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { BarChart3, Check, DivideCircle, X } from "lucide-react";
import Papa from "papaparse";

/*
 * CSV is bundled in public/sapix_150.csv  (Front,Back,Extra)
 * On dev server or GitHub Pages it is fetched once at load.
 */

function useCards() {
  const [cards, setCards] = useState([]);
  useEffect(() => {
    fetch("/sapix_150.csv")
      .then(r => r.text())
      .then(text => {
        const data = Papa.parse(text, { header: true, skipEmptyLines: true }).data.map(r => ({
          front: r.Front,
          back: r.Back,
          extra: r.Extra,
        }));
        setCards(data);
      });
  }, []);
  return cards;
}

export default function FlashcardApp() {
  const cards = useCards();
  const [group, setGroup] = useState(null); // 0‑4
  const [startIdx, setStartIdx] = useState(0); // 0‑29 within group
  const [queue, setQueue] = useState([]); // indices relative to cards
  const [current, setCurrent] = useState(null);
  const [showBack, setShowBack] = useState(false);
  const [stats, setStats] = useState({ ok: 0, close: 0, wrong: 0 });

  const buildQueue = useCallback(() => {
    if (group === null) return;
    const base = group * 30;
    const indices = [...Array(30).keys()].map(i => base + i).slice(startIdx);
    setQueue(indices);
    setCurrent(null);
    setShowBack(false);
    setStats({ ok: 0, close: 0, wrong: 0 });
  }, [group, startIdx]);

  useEffect(() => { buildQueue(); }, [group]);

  const nextCard = useCallback(() => {
    if (queue.length === 0) {
      setCurrent(null);
      return;
    }
    setCurrent(queue[0]);
    setQueue(q => q.slice(1));
    setShowBack(false);
  }, [queue]);

  const gradeCard = (grade) => {
    setStats(prev => ({
      ok: prev.ok + (grade === 0 ? 1 : 0),
      close: prev.close + (grade === 1 ? 1 : 0),
      wrong: prev.wrong + (grade === 2 ? 1 : 0),
    }));
    if (grade > 0) setQueue(q => [...q, current]);
    nextCard();
  };

  if (cards.length === 0) {
    return <p className="mt-10 text-lg">Loading cards…</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6 gap-6">
      <h1 className="text-3xl font-bold">SAPIX 150 Flashcards</h1>

      {group === null && (
        <div className="flex flex-col items-center gap-4">
          <p className="font-medium">30問セットを選択</p>
          <div className="flex gap-3">
            {[1,2,3,4,5].map(n => (
              <Button key={n} onClick={() => setGroup(n-1)}>{n}</Button>
            ))}
          </div>
        </div>
      )}

      {group !== null && current === null && queue.length === 0 && (
        <div className="w-80 flex flex-col gap-4 items-center">
          <p>開始位置をスライダーで選択（0=最初）</p>
          <Slider defaultValue={[0]} max={29} step={1} onValueChange={([v]) => setStartIdx(v)} />
          <Button className="mt-4" onClick={buildQueue}>キューを作成</Button>
          {queue.length > 0 && <Button onClick={nextCard} className="mt-2">スタート</Button>}
        </div>
      )}

      {current !== null && (
        <Card className="w-full max-w-xl text-center">
          <CardContent className="p-8 flex flex-col items-center gap-4">
            <p className="text-xl font-semibold min-h-[4rem] flex items-center justify-center">
              {showBack ? cards[current].back : cards[current].front}
            </p>
            {showBack && cards[current].extra && <p className="text-sm text-gray-600">{cards[current].extra}</p>}
            <div className="flex gap-3 mt-4">
              {!showBack ? (
                <Button variant="secondary" onClick={() => setShowBack(true)}>答えを見る</Button>
              ) : (
                <>
                  <Button onClick={() => gradeCard(0)} className="bg-green-600 text-white flex gap-1"><Check className="w-4 h-4"/>覚えた</Button>
                  <Button onClick={() => gradeCard(1)} className="bg-yellow-500 text-white flex gap-1"><DivideCircle className="w-4 h-4"/>惜しい</Button>
                  <Button onClick={() => gradeCard(2)} variant="destructive" className="flex gap-1"><X className="w-4 h-4"/>全然</Button>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">残り {queue.length}</p>
          </CardContent>
        </Card>
      )}

      {group !== null && current === null && queue.length === 0 && (stats.ok + stats.close + stats.wrong) > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-medium">結果</p>
          <div className="flex gap-4">
            <span className="text-green-600 flex gap-1 items-center"><Check className="w-4 h-4"/> {stats.ok}</span>
            <span className="text-yellow-500 flex gap-1 items-center"><DivideCircle className="w-4 h-4"/> {stats.close}</span>
            <span className="text-red-600 flex gap-1 items-center"><X className="w-4 h-4"/> {stats.wrong}</span>
          </div>
          <Button className="mt-2" onClick={() => { setGroup(null); setQueue([]); }}>別セットを選ぶ</Button>
        </div>
      )}
    </div>
  );
}
