"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// constで型アサーションしてタプル型のまま維持する
const nextActions = ['play again', 'change game', 'exit',];
// ゲームプロシージャクラス
const gameTitles = ['hit and blow', 'janken'];
class GameProcedure {
    // 分かりにくいが、this.gameStore が設定されたことになる。
    constructor(gameStore) {
        this.gameStore = gameStore;
        this.currentGameTitle = '';
        // Gameから実装したゲームであれば、このGameProcedureクラスで動かせるということ
        this.currentGame = null;
    }
    // スタート処理
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.select();
            yield this.play();
        });
    }
    // メインフロー
    play() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentGame)
                throw new Error('ゲームが選択されていません');
            printLine(`===\n${this.currentGameTitle} を開始します。\n===`);
            yield this.currentGame.setting();
            yield this.currentGame.play();
            this.currentGame.end();
            const action = yield promptSelect('ゲームを続けますか？', nextActions);
            if (action == 'play again') {
                yield this.play();
            }
            else if (action == 'exit') {
                this.end();
            }
            else if (action == 'change game') {
                yield this.start();
            }
            else {
                const neverValue = action;
                throw new Error(`${neverValue} is on invalid action`);
            }
        });
    }
    // ゲーム選択
    select() {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentGameTitle =
                yield promptSelect('ゲームのタイトルを選択してください', gameTitles);
            this.currentGame = this.gameStore[this.currentGameTitle];
        });
    }
    // ゲーム終了処理
    end() {
        printLine('ゲームを終了します。');
        process.exit();
    }
}
// ゲーム抽象クラス
class Game {
}
/**
 * ゲーム１：ヒット・アンド・ブロー
 */
const modes = ['normal', 'hard'];
class HitAndBlow {
    constructor() {
        this.answerSource = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        this.answer = [];
        this.tryCount = 0;
        this.mode = 'normal';
    }
    // 正解の設定
    setting() {
        return __awaiter(this, void 0, void 0, function* () {
            // 型アサーションによる型変換を無くし、想定外の不具合の危険性を削減
            // 代わりにジェネリクスでメソッドで扱うTがMode型であることを指定。
            this.mode = yield promptSelect('ゲームの難易度を入力してください。', modes);
            const answerLength = this.getAnswerLength();
            // 指定の要素数で正解の数字リストを作成。数字に重複はなし。
            while (this.answer.length < answerLength) {
                const randNum = Math.floor(Math.random() * this.answerSource.length);
                const selectedItem = this.answerSource[randNum];
                if (!this.answer.includes(selectedItem)) {
                    this.answer.push(selectedItem);
                }
            }
        });
    }
    // モードチェックおよび正解の数字リストの要素数の取得処理
    getAnswerLength() {
        switch (this.mode) {
            case 'normal': return 3;
            case 'hard': return 4;
            default:
                const neverValue = this.mode; // case網羅保証
                throw new Error(`${neverValue}は、無効なモードです`);
        }
    }
    // ゲーム進行
    play() {
        return __awaiter(this, void 0, void 0, function* () {
            // 回答の入力を要求
            const answerLength = this.getAnswerLength();
            const inputArr = (yield promptInput(`「,」区切りで${answerLength}つの数字を入力してください`)).split(',');
            // 回答バリデーション
            if (!this.validation(inputArr)) {
                printLine('--- 回答内容が不正です。---');
                yield this.play(); // 再帰実行
                return;
            }
            // 試行回数をカウント
            this.tryCount++;
            // 回答のチェック結果を取得
            const result = this.check(inputArr);
            // 正解の要素数=hit数であればクリア
            // それ以外はヒントを表示して再入力を要求
            if (result.hit != this.answer.length) {
                printLine(`--- ヒント\n Hit:${result.hit}\nBlow:${result.blow}\n---`);
                yield this.play(); // 再帰実行
            }
        });
    }
    // 正解と回答の比較
    check(input) {
        let hitCount = 0;
        let blowCount = 0;
        input.forEach((val, index) => {
            // hitチェック
            if (val === this.answer[index]) {
                hitCount++;
                // blowチェック
            }
            else if (this.answer.includes(val)) {
                blowCount++;
            }
        });
        return {
            hit: hitCount,
            blow: blowCount
        };
    }
    end() {
        printLine(`--- 正解です。\n試行回数：${this.tryCount}\n---`);
        this.reset();
        // process.exit() 終了させず、選べるようにするため削除
    }
    reset() {
        this.answer = [];
        this.tryCount = 0;
    }
    // 回答バリデーション：エラーの場合は試行回数にノーカウント。回答を再要求。
    validation(inputArr) {
        // 文字列チェック１：文字列数が正解の文字列数と同じであること
        const isLengthValid = inputArr.length == this.answer.length;
        // 文字列チェック２：正解の候補に含まれる値であること
        const isAllAnswerSourceOption = inputArr.every((val) => this.answerSource.includes(val));
        // 文字列チェック３：重複がないこと
        const isAllDifferentValues = inputArr.every((val, index) => inputArr.indexOf(val) == index);
        return isLengthValid && isAllAnswerSourceOption && isAllDifferentValues;
    }
}
/**
 * ゲーム２：Janken
 */
const jankenOption = ['rock', 'paper', 'scissor'];
class Janken {
    constructor() {
        this.rounds = 0;
        this.currentRound = 1;
        this.result = {
            win: 0,
            lose: 0,
            draw: 0,
        };
    }
    setting() {
        return __awaiter(this, void 0, void 0, function* () {
            const rounds = Number(yield promptInput('何本勝負にしますか？'));
            if (Number.isInteger(rounds) && rounds > 0) {
                this.rounds = rounds;
            }
            else {
                // 再帰呼び出し：もう一度入力を促す
                yield this.setting();
            }
        });
    }
    play() {
        return __awaiter(this, void 0, void 0, function* () {
            const uesrSelected = yield promptSelect(`【${this.currentRound}回戦】選択肢を入力してください`, jankenOption);
            const randomSelected = jankenOption[Math.floor(Math.random() * 3)];
            const result = Janken.judge(uesrSelected, randomSelected);
            let resultText;
            // 結果表示テキスト生成
            switch (result) {
                case 'win':
                    this.result.win++;
                    resultText = '勝ち';
                    break;
                case 'lose':
                    this.result.lose++;
                    resultText = '負け';
                    break;
                case 'draw':
                    this.result.draw++;
                    resultText = 'あいこ';
                    break;
            }
            printLine(`---\nあなた：${uesrSelected}\n相手：${randomSelected}\n結果：${resultText}`);
            // 設定回戦が終わるまで再帰
            if (this.rounds > this.currentRound) {
                this.currentRound++;
                yield this.play();
            }
        });
    }
    end() {
        printLine(`\n${this.result.win}勝 ${this.result.lose}負 ${this.result.draw}引き分けでした。`);
        this.reset();
    }
    reset() {
        this.rounds = 0;
        this.currentRound = 1;
        this.result = {
            win: 0,
            lose: 0,
            draw: 0,
        };
    }
    static judge(userSelected, randomSelected) {
        if (userSelected == 'rock') {
            if (randomSelected === 'rock')
                return 'draw';
            if (randomSelected === 'paper')
                return 'lose';
            return 'win';
        }
        else if (userSelected == 'paper') {
            if (randomSelected === 'rock')
                return 'win';
            if (randomSelected === 'paper')
                return 'draw';
            return 'lose';
        }
        else {
            if (randomSelected === 'rock')
                return 'lose';
            if (randomSelected === 'paper')
                return 'win';
            return 'draw';
        }
    }
}
// テキスト表示メソッド
const printLine = (text, breakline = true) => {
    process.stdout.write(text + (breakline ? '\n' : ''));
};
// クライアントからの入力受付処理メソッド
const readLine = () => __awaiter(void 0, void 0, void 0, function* () {
    const input = yield new Promise((resolve) => process.stdin.once('data', (data) => resolve(data.toString())));
    return input.trim();
});
// クライアントへの入力要求メソッド
const promptInput = (text) => __awaiter(void 0, void 0, void 0, function* () {
    printLine(`\n${text}\n `, false);
    return readLine();
});
// クライアントへの選択の入力要求メソッド
const promptSelect = (text, values) => __awaiter(void 0, void 0, void 0, function* () {
    // 選択肢前のテキストを出力
    printLine(`\n${text}\n `);
    // 選択肢を出力
    values.forEach((value) => printLine(`- ${value}`));
    printLine('>', false);
    // 入力受付
    const input = yield readLine();
    if (values.includes(input)) {
        return input;
    }
    else {
        // 再帰的に選択入力を要求
        return promptSelect(text, values);
    }
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    new GameProcedure({
        'hit and blow': new HitAndBlow(),
        'janken': new Janken(),
    }).start();
}))();
