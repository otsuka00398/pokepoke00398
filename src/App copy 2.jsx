/*　宣言方法
　　１）var　：古い書き方、バグの原因になりやすい
　　２）let　：変数
　　３）const：定数
*/

// UseState＝値が変わると画面を自動更新
// UseEffect＝データ取得、タイマーとか
import React, { useState, useEffect, useRef } from "react";
import usokki0185 from './pic/usokki0185.svg';
import mahoippu0869 from './pic/mahoippu0869.svg';
import ponita0077 from './pic/ponita0077.svg';
import './App.css';

function App() { // App() ページの本体
  const pokeImages = [usokki0185, mahoippu0869,ponita0077]; // 画像リスト
  const pokeNames = ['ウソッキー', 'マホイップ','ポニータ']; // 名前リスト

 // currentIndex＝現在〇番目、setCurrentIndex＝更新するメソッド、useState(0)＝初期値（0）
  const [currentIndex, setCurrentIndex] = useState(0);  
  const [isShuffling, setIsShuffling] = useState(true); 
  const shuffleIntervalRef = useRef(null); // タイマーの管理

  useEffect(() => {
    if (!isShuffling)return; // 停止中なら何もしない
    
    // setInterval＝JavaScriptの組み込み関数、画像を順番に変更
    shuffleIntervalRef.current = setInterval(() => {
      // prevIndex + 1 で次の画像に変更、% pokeImages.length で 最後の画像の次は最初に戻る
      setCurrentIndex((prevIndex) => (prevIndex + 1) % pokeImages.length);
    }, 200); // 0.2秒ごとに変更

    // clearInterval＝JavaScriptの組み込み関数、コンポーネントが更新されたら停止
    return () => clearInterval(shuffleIntervalRef.current); 
  }, [isShuffling]); // isShuffling が変更されたら再実行

  // 画像クリックでシャッフルのON/OFF切り替え
  const handleClick = () => {
    setIsShuffling((prev) => !prev); // クリックで ON/OFF 切り替え
  };

  return (
    <div className="App">
      {/* タグの中はJSX式
      　div で全体を囲む（CSSの適用のため）
      　header を使ってコンテンツをまとめる
      */}
      <header className="App-header">
        <h2>おすすめポケモン</h2>
        <p>画像をクリック！</p>
        <img
          src={pokeImages[currentIndex]} 
          className="App-image" //css用に記述
          onClick={handleClick}
          style={{ cursor: "pointer" }}//画像の上にカーソルをおくと手のひらになる
          alt={pokeNames[currentIndex]} // 画像に名前を追加
        />
        <p>{pokeNames[currentIndex]}</p> {/* ポケモンの名前 */}
      </header>
    </div>
  );
}

export default App;