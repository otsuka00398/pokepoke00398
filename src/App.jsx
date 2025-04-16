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

// 画像・動画・ドキュメントの保存 ×DB　〇ストレージ（ファイル保存領域）
// Amazon S3 で内容見れる
import { getUrl, uploadData } from "aws-amplify/storage";

// AWS AppSync（GraphQL）を簡単に操作できるクライアントの生成
import { generateClient } from "aws-amplify/data";

import outputs from "../amplify_outputs.json";
import './App.css';

Amplify.configure(outputs);
// client.models.Note.〇〇　でデータを扱えるようにする
const client = generateClient({ authMode: "userPool" });

// Reactのメインコンポーネント
export default function App() {

  //const pokeImages = [usokki0185, mahoippu0869, ponita0077];// 画像リスト
  const pokeImages = ["/usokki0185.svg","/mahoippu0869.svg","/ponita0077.svg"];
  const pokeNames = ['ウソッキー', 'マホイップ', 'ポニータ'];// 名前リスト
  const pokeTypes = ['いわ', 'フェアリー', 'ほのお'];// 名前リスト
  const [notes, setNotes] = useState([]);// 登録したポケモン情報を管理する配列

  // currentIndex＝現在〇番目、setCurrentIndex＝更新するメソッド、useState(0)＝初期値（0）
  const [currentIndex, setCurrentIndex] = useState(0);//現在表示されているポケモン画像のインデックス
  const [isShuffling, setIsShuffling] = useState(true);// シャッフルの ON/OFF を管理する状態
  const shuffleIntervalRef = useRef(null);// setInterval を管理するための参照 (useRef)


  /////useEffect、fetchNotes//////////////////////////////////////////////////////////////////////////////////

  // データ取得＆シャッフル
  useEffect(() => {
    fetchNotes();// 登録したポケモンの初回データ取得
    if (!isShuffling) return;// シャッフル停止中なら何もしない

    shuffleIntervalRef.current = setInterval(() => {
      // prevIndex + 1 で次の画像に変更、% pokeImages.length で 最後の画像の次は最初に戻る
      setCurrentIndex((prevIndex) => (prevIndex + 1) % pokeImages.length);
    }, 200); // 0.2秒ごとに変更

    // タイマーをリセット
    return () => clearInterval(shuffleIntervalRef.current);
  }, [isShuffling]);

  // ポケモンデータの取得
  // asyncをつけたら必ずPromise　awaitでfetchNotesの完了を待つ 
  async function fetchNotes() {
    const { data: notes } = await client.models.Note.list();
    await Promise.all(
      notes.map(async (note) => {
        if (note.image) {
          const linkToStorageFile = await getUrl({
            //path には S3の保存パスを指定
            path: ({ identityId }) => `media/${identityId}/${note.image}`,
          });
          note.image = linkToStorageFile.url;
        }
        return note;
      })
    );
    setNotes(notes);
  }

  /////クリックイベント//////////////////////////////////////////////////////////////////////////////////

  // クリックすると isShuffling を true/false で切り替え
  const handleClick = () => {
    setIsShuffling((prev) => !prev); // クリックで ON/OFF 切り替え
  };

  // ポケモンの登録　⇒登録データはAmazon DynamoDBに保存
  async function createNote(event) {
    event.preventDefault();// フォームの送信を防ぐ
    const form = new FormData(event.target);

    // DynamoDB の Noteテーブルにデータ保存
    // client.models.Note.list() で　DynamoDB から登録済みデータを取得
    const { data: newNote } = await client.models.Note.create({
      name: form.get("name"),
      description: form.get("description"),
      image: form.get("image").name,
    });

    if (newNote.image) {// 画像がある場合は、 Amazon S3に保存
      await uploadData({
        path: ({ identityId }) => `media/${identityId}/${newNote.image}`,//path には S3の保存パスを指定
        data: form.get("image"),
      }).result;
    }
    fetchNotes();// 最新データを取得
    event.target.reset();
  }

  // ポケモンを削除
  async function deleteNote({ id }) {
    const toBeDeletedNote = { id };
    await client.models.Note.delete(toBeDeletedNote);
    fetchNotes();
  }

    // おすすめポケモン登録
    async function rcmPokemon({ index }) {
      const pokeName = pokeNames[index];
      const pokeImage = pokeImages[index];
      const pokeType = pokeTypes[index];

      // ファイル名を画像のパスから取得
      const fileName = pokeImage.split('/').pop();

      // 画像を fetch して Blob データに変換
      const response = await fetch(pokeImage);
      const imageBlob = await response.blob();
      const imageFile = new File([imageBlob], fileName, { type: imageBlob.type });

      // Note登録（DynamoDB）
       const { data: newNote } = await client.models.Note.create({
      name: pokeName,
      description: pokeType,
      image: imageFile.name,
    });

      // 画像ファイルを S3 に保存
      await uploadData({
        path: ({ identityId }) => `media/${identityId}/${imageFile.name}`,
        data: imageFile,
      }).result;

      fetchNotes(); // 最新データを取得

    }

  /////JSX（画面の表示）//////////////////////////////////////////////////////////////////////////////////
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
            {!isShuffling && (
            <View>
              <p>ポケモンの名前：{pokeNames[currentIndex]}</p>
              <p>ポケモンのタイプ：{pokeTypes[currentIndex]}</p> 
          
              <Button variation="primary" onClick={() => rcmPokemon({index:currentIndex})}>
                このポケモンを登録する
              </Button>
            </View>)}

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
                    onError={() => console.error("Image failed to load")}
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
