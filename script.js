
// ==================================
// BogoSort Experiment
// ==================================

// ゲーム状態
let numbers = [];
let attempts = 0;
let running = false;
let completed = false;

let timer = null;
let startTime = 0;
let elapsedTime = 0;

let rankingMode = "fewest";

// HTML要素
const $ = id => document.getElementById(id);

// ==================================
// ランキング保存
// ==================================

const STORAGE_KEY = "bogosort_ranking_v1";
const NAME_KEY = "bogosort_player_name_v1";

function loadRanking() {
    try {
        const data = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveRanking(data) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );
        return true;
    } catch {
        $("status").textContent =
            "保存できませんでした。ブラウザの保存設定を確認してください。";
        return false;
    }
}

// ==================================
// 初期化
// ==================================

function resetSort() {
    stopSort();

    const count = Number($("count").value);

    numbers = Array.from(
        { length: count },
        (_, i) => i + 1
    );

    shuffle();

    attempts = 0;
    elapsedTime = 0;
    completed = false;

    updateDisplay();
    updateStats();
    updateTimer();

    $("status").textContent = "準備完了";
    $("share").disabled = true;

    // ボタンの状態をリセット
    $("start").disabled = false;
    $("stop").disabled = true;
}
// ==================================
// シャッフル
// ==================================

function shuffle() {
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [numbers[i], numbers[j]] =
        [numbers[j], numbers[i]];
    }
}

// ==================================
// ソート判定
// ==================================

function isSorted() {
    for (let i = 0; i < numbers.length - 1; i++) {
        if (numbers[i] > numbers[i + 1]) {
            return false;
        }
    }

    return true;
}

// ==================================
// 画面更新
// ==================================

function updateDisplay() {
    const bars = $("bars");

    bars.innerHTML = "";

    numbers.forEach(number => {
        const bar = document.createElement("div");

        bar.className = "bar";
        bar.style.height = (number * 25) + "px";
        bar.textContent = number;

        bars.appendChild(bar);
    });
}

function updateStats() {
    $("attempts").textContent =
        attempts.toLocaleString();
}

function getElapsed() {
    if (running) {
        return elapsedTime + performance.now() - startTime;
    }

    return elapsedTime;
}

function updateTimer() {
    $("timer").textContent =
        (getElapsed() / 1000).toFixed(2) + "秒";
}

// ==================================
// ゲーム開始
// ==================================

function startSort() {
    if (running || completed) return;

    const playerName = $("playerName").value.trim();

    if (!playerName) {
        $("status").textContent =
            "プレイヤー名を入力してください！";
        $("playerName").focus();
        return;
    }

    // 名前を保存
    localStorage.setItem(NAME_KEY, playerName);

    running = true;
    startTime = performance.now();

    $("start").disabled = true;
    $("stop").disabled = false;
    $("status").textContent = "シャッフル中...";

    sortStep();
}

// ==================================
// ボゴソート
// ==================================

function sortStep() {
    if (!running) return;

    // 完成判定
    if (isSorted()) {
        finishSort();
        return;
    }

    shuffle();
    attempts++;

    updateDisplay();
    updateStats();
    updateTimer();

    const speed = Number($("speed").value);

    timer = setTimeout(
        sortStep,
        101 - speed
    );
}

// ==================================
// ソート完了
// ==================================

function finishSort() {
    elapsedTime += performance.now() - startTime;

    running = false;
    completed = true;

    clearTimeout(timer);

    updateDisplay();
    updateTimer();

    $("status").textContent = "🎉 ソート完了！";
    $("start").disabled = true;
    $("stop").disabled = true;
    $("share").disabled = false;

    registerRanking();
}

// ==================================
// ランキング登録
// ==================================

function registerRanking() {
    const playerName = $("playerName").value.trim();

    const record = {
        name: playerName,
        attempts: attempts,
        duration: Math.round(elapsedTime),
        count: numbers.length,
        date: new Date().toISOString()
    };

    const ranking = loadRanking();

    ranking.push(record);

    // 最大1000件まで保存
    if (ranking.length > 1000) {
        ranking.splice(0, ranking.length - 1000);
    }

    if (saveRanking(ranking)) {
        renderRanking();

        $("status").textContent =
            "🎉 ソート完了！ランキングに記録しました。";
    }
}

// ==================================
// 停止・再開
// ==================================

function stopSort() {
    if (running) {
        elapsedTime += performance.now() - startTime;
    }

    running = false;

    clearTimeout(timer);

    $("start").disabled = completed;
    $("stop").disabled = true;

    updateTimer();

    if (!completed) {
        $("status").textContent = "停止中";
    }
}

// ==================================
// ランキング表示
// ==================================

function renderRanking() {
    const ranking = loadRanking();

    let sorted = [...ranking];

    if (rankingMode === "fewest") {
        sorted.sort((a, b) => a.attempts - b.attempts);
    }

    if (rankingMode === "most") {
        sorted.sort((a, b) => b.attempts - a.attempts);
    }

    if (rankingMode === "fastest") {
        sorted.sort((a, b) => a.duration - b.duration);
    }

    const list = $("rankingList");

    list.innerHTML = "";

    if (sorted.length === 0) {
        list.textContent =
            "ランキングデータがありません。";
        list.className = "empty";
        return;
    }

    list.className = "";

    sorted.slice(0, 20).forEach((record, index) => {
        const row = document.createElement("div");
        row.className = "ranking-row";

        const rank = document.createElement("div");
        rank.className = "rank-number";

        rank.textContent =
            ["🥇", "🥈", "🥉"][index] || (index + 1) + "位";

        const info = document.createElement("div");

        const name = document.createElement("div");
        name.className = "rank-name";
        name.textContent = record.name;

        const detail = document.createElement("div");
        detail.className = "rank-detail";
        detail.textContent =
            record.count + "個 | " +
            new Date(record.date).toLocaleDateString("ja-JP");

        info.append(name, detail);

        const score = document.createElement("div");
        score.className = "rank-score";

        if (rankingMode === "fastest") {
            score.textContent =
                (record.duration / 1000).toFixed(2) + "秒";
        } else {
            score.textContent =
                record.attempts.toLocaleString() + "回";
        }

        row.append(rank, info, score);

        list.appendChild(row);
    });
}

// ==================================
// ランキング切り替え
// ==================================

document.querySelectorAll(".tab").forEach(button => {
    button.addEventListener("click", () => {
        rankingMode = button.dataset.mode;

        document.querySelectorAll(".tab").forEach(tab => {
            tab.classList.remove("active");
        });

        button.classList.add("active");

        renderRanking();
    });
});

// ==================================
// X共有
// ==================================

function shareResult() {
    if (!completed) return;

    const name = $("playerName").value.trim();

    const text =
        "💀 BogoSort 結果報告！\n" +
        "プレイヤー：" + name + "\n" +
        "数字の数：" + numbers.length + "個\n" +
        "シャッフル回数：" +
        attempts.toLocaleString() + "回\n" +
        "クリアタイム：" +
        (elapsedTime / 1000).toFixed(2) + "秒\n" +
        "#BogoSort";

    const url = location.protocol.startsWith("http")
        ? location.href
        : "";

    const shareURL =
        "https://twitter.com/intent/tweet?text=" +
        encodeURIComponent(text) +
        (url ? "&url=" + encodeURIComponent(url) : "");

    window.open(
        shareURL,
        "_blank",
        "noopener,noreferrer"
    );
}

// ==================================
// ランキング削除
// ==================================

function clearRanking() {
    if (!confirm("すべてのランキング記録を削除しますか？")) {
        return;
    }

    if (saveRanking([])) {
        renderRanking();
        $("status").textContent = "ランキングを削除しました。";
    }
}

// ==================================
// イベント設定
// ==================================

$("start").addEventListener("click", startSort);
$("stop").addEventListener("click", stopSort);
$("reset").addEventListener("click", resetSort);
$("share").addEventListener("click", shareResult);
$("clearRanking").addEventListener("click", clearRanking);

// 数字の数
$("count").addEventListener("input", function() {
    $("countValue").textContent = this.value;
    resetSort();
});

// 速度
$("speed").addEventListener("input", function() {
    $("speedValue").textContent = this.value;
});

// プレイヤー名の復元
$("playerName").value =
    localStorage.getItem(NAME_KEY) || "";

// 初期表示
