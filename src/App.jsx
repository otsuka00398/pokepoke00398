// UseState＝状態を管理（変数のようなもの）
// UseEffect＝データ取得、タイマーとか
// useRef＝setInterval などのタイマーを管理するために使用
import React, { useState, useEffect, useRef } from "react";
import {
  Authenticator,
  Button,
  Text,
  TextField,
  Heading,
  Flex,
  View,
  Image,
  Grid,
  Divider,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { getUrl, uploadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";
import usokki0185 from './pic/usokki0185.svg';
import mahoippu0869 from './pic/mahoippu0869.svg';
import ponita0077 from './pic/ponita0077.svg';
import './App.css';

// AWS Amplify の設定
Amplify.configure(outputs);
const client = generateClient({ authMode: "userPool" });

// Reactのメインコンポーネント
export default function App() {

  // 画像リスト
  const pokeImages = [usokki0185, mahoippu0869, ponita0077]; 

  // 名前リスト
  const pokeNames = ['ウソッキー', 'マホイップ', 'ポニータ']; 

  // 登録したポケモン情報を管理する配列
  const [notes, setNotes] = useState([]);

  // currentIndex＝現在〇番目、setCurrentIndex＝更新するメソッド、useState(0)＝初期値（0）
  //現在表示されているポケモン画像のインデックス
  const [currentIndex, setCurrentIndex] = useState(0);

  // シャッフルの ON/OFF を管理する状態
  const [isShuffling, setIsShuffling] = useState(true);

  // setInterval を管理するための参照 (useRef)
  const shuffleIntervalRef = useRef(null);

  // データ取得＆シャッフル
  useEffect(() => {
    // 登録したポケモンの初回データ取得
    fetchNotes();

    // シャッフル停止中なら何もしない
    if (!isShuffling) return;

    shuffleIntervalRef.current = setInterval(() => {
      // prevIndex + 1 で次の画像に変更、% pokeImages.length で 最後の画像の次は最初に戻る
      setCurrentIndex((prevIndex) => (prevIndex + 1) % pokeImages.length);
    }, 200); // 0.2秒ごとに変更

      // タイマーをリセット
    return () => clearInterval(shuffleIntervalRef.current); 
  }, [isShuffling]);

  //  クリックすると isShuffling を true/false で切り替え
  const handleClick = () => {
    setIsShuffling((prev) => !prev); // クリックで ON/OFF 切り替え
  };

  // ポケモンデータの取得
  async function fetchNotes() {
    const { data: notes } = await client.models.Note.list();
    await Promise.all(
      notes.map(async (note) => {
        if (note.image) {
          const linkToStorageFile = await getUrl({
            path: ({ identityId }) => `media/${identityId}/${note.image}`,
          });
          note.image = linkToStorageFile.url;
        }
        return note;
      })
    );
    setNotes(notes);
  }

  // ポケモンの登録
  async function createNote(event) {
    // フォームの送信を防ぐ
    event.preventDefault();
    const form = new FormData(event.target);

    // データを追加
    const { data: newNote } = await client.models.Note.create({
      name: form.get("name"),
      description: form.get("description"),
      image: form.get("image").name,
    });

    // 画像がある場合は、アップロード
    if (newNote.image) {
      await uploadData({
        path: ({ identityId }) => `media/${identityId}/${newNote.image}`,
        data: form.get("image"),
      }).result;
    }

    // 最新データを取得
    fetchNotes();
    event.target.reset();
  }

  // ポケモンを削除
  async function deleteNote({ id }) {
    const toBeDeletedNote = { id };
    await client.models.Note.delete(toBeDeletedNote);
    fetchNotes();
  }

  // JSX（画面の表示）
  return (
    <Authenticator>
      {({ signOut }) => (
        <Flex
          className="App"
          justifyContent="center"
          alignItems="center"
          direction="column"
          width="70%"
          margin="0 auto"
        >
        <Heading level={1}>ポケモン暗記帳</Heading>
        <div>
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

          <h2>ポケモンを登録する</h2>
          <View as="form" margin="0.5rem 0" onSubmit={createNote}>
            <Flex direction="column" justifyContent="center" gap="1.5rem" padding="0.5rem">
              <TextField
                name="name"
                placeholder="ポケモンの名前"
                label="ポケモンの名前"
                labelHidden
                variation="quiet"
                required
              />
              <TextField
                name="description"
                placeholder="ポケモンのタイプ"
                label="ポケモンのタイプ"
                labelHidden
                variation="quiet"
                required
              />
              <View
                name="image"
                as="input"
                type="file"
                alignSelf={"end"}
                accept="image/png, image/jpeg"
              />
              <Button type="submit" variation="primary">
                登録
              </Button>
            </Flex>
          </View>
          </div>
          <Divider />
          

          <h2>登録したポケモン</h2>
          <Grid
            margin="0.5rem 0"
            autoFlow="column"
            justifyContent="center"
            gap="2rem"
          >
            {notes.map((note) => (
              <Flex
                key={note.id || note.name}
                direction="column"
                justifyContent="center"
                alignItems="center"
                gap="0.1rem"
                border="1px solid #ccc"
                padding="1rem"
                borderRadius="5%"
                className="box"
              >
                <View>
                  <Heading level="4">{note.name}</Heading>
                </View>
                <Text fontStyle="italic">タイプ：{note.description}</Text>
                {note.image && (
                  <Image
                    src={note.image}
                    alt={`visual aid for ${note.name}`}
                    style={{ width: 150 }}
                  />
                )}
                <Button variation="destructive" onClick={() => deleteNote(note)}>
                  削除する
                </Button>
              </Flex>
            ))}
          </Grid>
          <Button onClick={signOut}>サインアウト</Button>
          <h1>  </h1>
        </Flex>
      )}
    </Authenticator>
  );
}
