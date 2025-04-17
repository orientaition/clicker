    // 4자리마다 콤마를 붙이는 함수
    function formatNumber4(num) {
        const str = num.toString();
        let result = '';
        let count = 0;
        for (let i = str.length - 1; i >= 0; i--) {
            result = str[i] + result;
            count++;
            if (count === 4 && i !== 0) {
                result = ',' + result;
                count = 0;
            }
        }
        return result;
    }

    // --- 게임 상태 변수 ---
    let money = 0;
    let helper = 0;
    let house = 0;
    let prestige = 0;
    let stars = 0;
    let clickCount = 0;

    // 구걸 업그레이드 관련 변수
    let begLevel = 1;
    let begAmount = 1;
    let begUpgradeCost = 10;

    // 알바생 관련 변수
    let helperCost = 10030;
    let helperCostRatio = 1.7;
    let helperIncomeStart = 1000;
    let helperIncomeRatio = 1.3;
    let helperIncomes = [];

    // 부동산 관련 변수
    let houseCost = 500000;
    let houseCostRatio = 1.8;
    let houseIncomeStart = 50000;
    let houseIncomeRatio = 1.3;
    let houseIncomes = [];

    // 프레스티지(환생) 보너스
    let prestigeBonus = 0;
    // 프레스티지 관련 변수
    let prestigeCostBase = 1000000000000; // 기본 환생 비용 (1조)
    let prestigeCostIncrement = 100000000000; // 환생 시 비용 증가량 (1000억)
    let prestigeStartBonus = 5;    // 첫 환생 보너스 %
    let prestigeBonusRatio = 1.1;   // 환생 보너스 증가율

    // 연구소 관련 변수
    let researchCostBase = 100; // 기본 연구 비용
    let researchCostRatio = 2; // 연구 비용 증가율
    let researchMaxLevel = 5;    // 최대 연구 레벨
    let helperBoostLevels = [1, 3, 5, 8, 12]; // 알바생 수익 증가량 %
    let houseBoostLevels = [2, 4, 7, 11, 16];  // 부동산 수익 증가량 %
    // 연구소(업그레이드) 상태
    let research = {
        helperBoost: 0, // 알바생 수익 영구 증가 %
        houseBoost: 0,  // 부동산 수익 영구 증가 %
    };

    // 테마
    let theme = 0; // 0: 기본, 1: 다크

    // 음향 효과
    let bgmOn = true;
    let clickSoundOn = true;

    // 업적 시스템
    const achievements = [
        { id: 'money1', name: '1억 거지', desc: '1억 원 달성', check: () => money >= 100000000, reward: 1, achieved: false },
        { id: 'helper10', name: '알바생 대장', desc: '알바생 10명 고용', check: () => helper >= 10, reward: 1, achieved: false },
        { id: 'estate10', name: '부동산 부자', desc: '부동산 10채 보유', check: () => house >= 10, reward: 1, achieved: false },
        { id: 'prestige1', name: '환생의 시작', desc: '첫 환생 달성', check: () => prestige >= 1, reward: 3, achieved: false },
        { id: 'click100', name: '클릭 마스터', desc: '클릭 100회', check: () => clickCount >= 100, reward: 1, achieved: false },
    ];

    // 미션 시스템 (매일 00시 리셋)
    const missions = [
        { id: 'daily_click', name: '오늘의 클릭', desc: '클릭 50회', check: () => clickCount >= 50, reward: 5000, done: false },
        { id: 'daily_helper', name: '알바생 고용', desc: '알바생 2명 고용', check: () => helper >= 2, reward: 10000, done: false },
        { id: 'daily_house', name: '부동산 구매', desc: '부동산 1채 구매', check: () => house >= 1, reward: 20000, done: false },
    ];
    let missionProgress = { daily_click: 0, daily_helper: 0, daily_house: 0, lastDate: "" };

    // 랭킹(로컬 최고 기록)
    let localRanking = { maxMoney: 0, maxClick: 0, maxPrestige: 0 };

    // 특수 아이템/스킬
    let buff = { click: 1, auto: 1, remain: 0 };

    // 랜덤박스/이벤트
    let eventActive = false;

    // --- UI 업데이트 ---
    function updateScreen(msg = "") {
        let totalHelperIncome = Math.floor(helperIncomes.reduce((a, b) => a + b, 0) * (1 + research.helperBoost/100));
        let totalHouseIncome = Math.floor(houseIncomes.reduce((a, b) => a + b, 0) * (1 + research.houseBoost/100));
        let totalSecIncome = Math.floor((totalHelperIncome + totalHouseIncome) * (1 + prestigeBonus/100) * buff.auto);

        document.getElementById("money").innerText = `💰 ${formatNumber4(money)} 원`;
        document.getElementById("beg-level").innerText = begLevel;
        document.getElementById("helper-count").innerText = helper;
        document.getElementById("estate-count").innerText = formatNumber4(house);
        document.getElementById("prestige-count").innerText = prestige;
        document.getElementById("star-count").innerText = stars;
        document.getElementById("beg-amount-info").innerText = formatNumber4(Math.floor(begAmount * (1 + prestigeBonus/100) * buff.click));
        document.getElementById("sec-income-info").innerText = formatNumber4(totalSecIncome);
        document.getElementById("beg-upgrade-cost").innerText = formatNumber4(begUpgradeCost);
        document.getElementById("helper-cost").innerText = formatNumber4(helperCost);
        document.getElementById("house-cost").innerText = formatNumber4(houseCost);
        if (msg) document.getElementById("log").innerText = msg;
    }

    // --- 업적 체크 및 달성시 팝업 ---
    function checkAchievements() {
        achievements.forEach(a => {
            if (!a.achieved && a.check()) {
                a.achieved = true;
                stars += a.reward;
                saveGame();
                showPopup(`업적 달성!<br><b>${a.name}</b><br>${a.desc}<br>보상: ⭐${a.reward}개`);
            }
        });
    }

    function showPopup(msg) {
        const popup = document.getElementById('achievement-popup');
        popup.innerHTML = msg + '<br><button onclick="closePopup()">닫기</button>';
        popup.classList.add('active');
    }
    function closePopup() {
        document.getElementById('achievement-popup').classList.remove('active');
    }

    // --- 업적 모달 ---
    function showAchievements() {
        let html = `<b>업적 목록</b><div class="achievements-list">`;
        achievements.forEach(a => {
            html += `<div class="${a.achieved ? 'achieved' : ''}">${a.name} - ${a.desc} ${a.achieved ? '⭐' : ''}</div>`;
        });
        html += `</div><button onclick="closeModal('achievements-modal')">닫기</button>`;
        const modal = document.getElementById('achievements-modal');
        modal.innerHTML = html;
        modal.classList.add('active');
    }
    function closeModal(id) {
        document.getElementById(id).classList.remove('active');
    }
    // 환생 비용 계산 함수
    function getPrestigeCost() {
        return prestigeCostBase + (prestige * prestigeCostIncrement);
    }

    // --- 환생 모달 ---
    function showPrestige() {
        let html = `<b>환생 (프레스티지)</b><div class="prestige-list">`;
        html += `<div>현재 환생 횟수: ${prestige}회</div>`;
        html += `<div>환생 시 획득 별 개수: ${getPrestigeStars()}개</div>`;
        html += `<div>환생 시 보너스: ${prestigeStartBonus + (prestige * prestigeBonusRatio)}%</div>`;
        html += `<div>다음 환생 비용: ${formatNumber4(getPrestigeCost())}원</div>`;
        html += `</div><button onclick="doPrestige()">환생하기</button><button onclick="closeModal('prestige-modal')">닫기</button>`;
        const modal = document.getElementById('prestige-modal');
        modal.innerHTML = html;
        modal.classList.add('active');
    }

    // 환생 시 획득하는 별 개수 계산 함수
    function getPrestigeStars() {
        let moneyForStar = 1000000000; // 10억
        let stars = Math.floor(money / moneyForStar);
        return stars;
    }

    // 실제 환생 로직
    function doPrestige() {
        let prestigeCost = getPrestigeCost();
        if (money < prestigeCost) {
            showPopup('돈이 부족합니다.');
            return;
        }

        let newStars = getPrestigeStars();
        if (newStars <= 0) {
            showPopup('환생하려면 최소 10억 원이 필요합니다.');
            return;
        }

        money -= prestigeCost;
        stars += newStars;
        prestige++;
        prestigeBonus = prestigeStartBonus + (prestige * prestigeBonusRatio);

        // 게임 상태 초기화
        helper = 0;
        house = 0;
        helperIncomes = [];
        houseIncomes = [];
        begLevel = 1;
        begAmount = 1;
        begUpgradeCost = 10;
        helperCost = 10030;
        houseCost = 500000;

        saveGame();
        updateScreen("환생 완료! 별 " + newStars + "개 획득!");
        closeModal('prestige-modal');
    }

    // --- 연구소 모달 ---
    function showResearch() {
        let html = `<b>연구소</b><div class="research-list">`;
        html += `<div>알바생 수익 증가: ${research.helperBoost}% (다음 레벨: ${helperBoostLevels[research.helperBoost] || '최대'}%)</div>`;
        html += `<div>부동산 수익 증가: ${research.houseBoost}% (다음 레벨: ${houseBoostLevels[research.houseBoost] || '최대'}%)</div>`;
        html += `<div>알바생 연구 비용: ${formatNumber4(getResearchCost('helperBoost'))} 별</div>`;
        html += `<div>부동산 연구 비용: ${formatNumber4(getResearchCost('houseBoost'))} 별</div>`;
        html += `</div><button onclick="upgradeResearch('helperBoost')">알바생 연구</button><button onclick="upgradeResearch('houseBoost')">부동산 연구</button><button onclick="closeModal('research-modal')">닫기</button>`;
        const modal = document.getElementById('research-modal');
        modal.innerHTML = html;
        modal.classList.add('active');
    }

    // 연구 비용 계산 함수
    function getResearchCost(type) {
        let level = research[type];
        return researchCostBase * Math.pow(researchCostRatio, level);
    }

    // 연구(업그레이드) 함수
    function upgradeResearch(type) {
        let cost = getResearchCost(type);
        if (stars < cost) {
            showPopup('별이 부족합니다.');
            return;
        }
        if (research[type] >= researchMaxLevel) {
            showPopup('최대 레벨입니다.');
            return;
        }

        stars -= cost;
        research[type]++;

        if (type === 'helperBoost') {
            research.helperBoost = helperBoostLevels[research.helperBoost-1];
        } else if (type === 'houseBoost') {
            research.houseBoost = houseBoostLevels[research.houseBoost-1];
        }

        saveGame();
        updateScreen('연구 완료!');
        showResearch(); // 연구소 모달 다시 열기
    }

    // --- 이벤트 모달 ---
    function showEvent() {
        let html = `<b>이벤트 / 랜덤박스</b><div>준비 중입니다.</div><button onclick="closeModal('event-modal')">닫기</button>`;
        const modal = document.getElementById('event-modal');
        modal.innerHTML = html;
        modal.classList.add('active');
    }

    // --- 랭킹 모달 ---
    function showRanking() {
        let html = `<b>랭킹 (로컬)</b><div class="rank-list">`;
        html += `<div>최고 금액: ${formatNumber4(localRanking.maxMoney)}원</div>`;
        html += `<div>최고 클릭: ${formatNumber4(localRanking.maxClick)}회</div>`;
        html += `<div>최고 환생: ${formatNumber4(localRanking.maxPrestige)}회</div>`;
        html += `</div><button onclick="closeModal('ranking-modal')">닫기</button>`;
        const modal = document.getElementById('ranking-modal');
        modal.innerHTML = html;
        modal.classList.add('active');
    }

    // --- 구걸하기 ---
    function earnMoney() {
        playSound('click-sound');
        money += Math.floor(begAmount * (1 + prestigeBonus/100) * buff.click);
        clickCount++;

        // 코인 애니메이션
        const coin = document.createElement('img');
        coin.src = 'coin.gif'; // 코인 이미지 URL
        coin.className = 'coin';
        document.getElementById('coin-container').appendChild(coin);
        coin.addEventListener('animationend', () => coin.remove());

        // 캐릭터 흔들기
        const beggar = document.getElementById('beggar');
        beggar.style.transform = 'translateY(-5px)';
        setTimeout(() => {
            beggar.style.transform = 'translateY(0)';
        }, 100);

        updateScreen();
        checkAchievements();
        checkMissions();

        // 로컬 랭킹 업데이트
        if (clickCount > localRanking.maxClick) {
            localRanking.maxClick = clickCount;
        }
        saveGame();
    }

    // --- 구걸 업그레이드 ---
    function upgradeBeg() {
        if (money >= begUpgradeCost) {
            money -= begUpgradeCost;
            begLevel++;
            begAmount = Math.floor(begAmount * 1.15);
            begUpgradeCost = Math.floor(begUpgradeCost * 1.18);
            updateScreen("구걸 레벨 업!");
        } else {
            updateScreen("돈이 부족합니다.");
        }
    }

    // --- 알바생 고용 ---
    function buyHelper() {
        if (money >= helperCost) {
            playSound('click-sound');
            money -= helperCost;
            helper++;

            // 알바생 수익 계산 및 저장
            let income = Math.floor(helperIncomeStart * Math.pow(helperIncomeRatio, helperIncomes.length));
            helperIncomes.push(income);

            // 알바생 고용 비용 증가
            helperCost = Math.floor(helperCost * helperCostRatio);
            updateScreen("알바생 고용!");
        } else {
            updateScreen("돈이 부족합니다.");
        }
    }

    // --- 부동산 구매 ---
    function buyHouse() {
        if (money >= houseCost) {
            playSound('click-sound');
            money -= houseCost;
            house++;

            // 부동산 수익 계산 및 저장
            let income = Math.floor(houseIncomeStart * Math.pow(houseIncomeRatio, houseIncomes.length));
            houseIncomes.push(income);

            houseCost = Math.floor(houseCost * houseCostRatio);
            updateScreen("부동산 구매!");
        } else {
            updateScreen("돈이 부족합니다.");
        }
    }

    // --- 테마 변경 ---
    function toggleTheme() {
        theme = 1 - theme;
        if (theme === 1) {
            document.body.style.background = '#333';
            document.body.style.color = '#eee';
        } else {
            document.body.style.background = '#f7f7e7';
            document.body.style.color = '#000';
        }
        saveGame();
    }

    // --- 배경음악 ON/OFF ---
    function toggleBgm() {
        const bgm = document.getElementById('bgm');
        bgmOn = !bgmOn;
        if (bgmOn) {
            bgm.play();
        } else {
            bgm.pause();
        }
    }

    // --- 효과음 재생 ---
    function playSound(id) {
        if (!clickSoundOn) return;
        const sound = document.getElementById(id);
        sound.currentTime = 0; // rewind to the beginning
        sound.play();
    }

    // --- 미션 모달 및 체크 ---
    function showMissions() {
        let html = `<b>오늘의 미션</b><div class="missions-list">`;
        missions.forEach(m => {
            html += `<div class="${m.done ? 'mission-done' : ''}">${m.name} - ${m.desc} ${m.done ? '✅' : ''}</div>`;
        });
        html += `</div><button onclick="checkMissions()">미션 완료 확인</button><button onclick="closeModal('missions-modal')">닫기</button>`;
        const modal = document.getElementById('missions-modal');
        modal.innerHTML = html;
        modal.classList.add('active');
    }

    function checkMissions() {
        missions.forEach(m => {
            if (!m.done && m.check()) {
                m.done = true;
                showPopup(`미션 달성!<br><b>${m.name}</b><br>${m.desc}<br>보상: 💰${formatNumber4(m.reward)}원`);
                money += m.reward;
            }
        });
        updateScreen();
        closeModal('missions-modal');
    }

    // --- 날짜 확인 및 미션 초기화 ---
    function checkDateAndResetMissions() {
        const today = new Date().toISOString().slice(0, 10);
        if (missionProgress.lastDate !== today) {
            missionProgress = { daily_click: 0, daily_helper: 0, daily_house: 0, lastDate: today };
            missions.forEach(m => m.done = false);
            saveGame();
        }
    }

    // --- 게임 저장 및 불러오기 ---
    function saveGame() {
        let save = {
            money: money,
            helper: helper,
            house: house,
            prestige: prestige,
            stars: stars,
            clickCount: clickCount,
            begLevel: begLevel,
            begAmount: begAmount,
            begUpgradeCost: begUpgradeCost,
            helperCost: helperCost,
            helperIncomes: helperIncomes,
            houseCost: houseCost,
            houseIncomes: houseIncomes,
            prestigeBonus: prestigeBonus,
            research: research,
            theme: theme,
            bgmOn: bgmOn,
            clickSoundOn: clickSoundOn,
            achievements: achievements.map(a => ({ id: a.id, achieved: a.achieved })),
            missions: missions.map(m => ({ id: m.id, done: m.done })),
            missionProgress: missionProgress,
            localRanking: localRanking
        };
        localStorage.setItem('beggarGameSave', JSON.stringify(save));
    }

    function loadGame() {
        let savegame = JSON.parse(localStorage.getItem('beggarGameSave'));
        if (savegame !== null) {
            money = savegame.money;
            helper = savegame.helper;
            house = savegame.house;
            prestige = savegame.prestige;
            stars = savegame.stars;
            clickCount = savegame.clickCount;
            begLevel = savegame.begLevel;
            begAmount = savegame.begAmount;
            begUpgradeCost = savegame.begUpgradeCost;
            helperCost = savegame.helperCost;
            helperIncomes = savegame.helperIncomes;
            houseCost = savegame.houseCost;
            houseIncomes = savegame.houseIncomes;
            prestigeBonus = savegame.prestigeBonus;
            research = savegame.research;
            theme = savegame.theme;
            bgmOn = savegame.bgmOn;
            clickSoundOn = savegame.clickSoundOn;
            if (savegame.achievements) {
                savegame.achievements.forEach(savedAchievement => {
                    const achievement = achievements.find(a => a.id === savedAchievement.id);
                    if (achievement) {
                        achievement.achieved = savedAchievement.achieved;
                    }
                });
            }
            if (savegame.missions) {
                savegame.missions.forEach(savedMission => {
                    const mission = missions.find(m => m.id === savedMission.id);
                    if (mission) {
                        mission.done = savedMission.done;
                    }
                });
            }
            missionProgress = savegame.missionProgress || { daily_click: 0, daily_helper: 0, daily_house: 0, lastDate: "" };
            localRanking = savegame.localRanking || { maxMoney: 0, maxClick: 0, maxPrestige: 0 };
            // 테마 로드
            if (theme === 1) {
                document.body.style.background = '#333';
                document.body.style.color = '#eee';
            } else {
                document.body.style.background = '#f7f7e7';
                document.body.style.color = '#000';
            }
            // 배경음악 로드
            const bgm = document.getElementById('bgm');
            if (bgmOn) {
                bgm.play();
            } else {
                bgm.pause();
            }
            updateScreen();
        }
    }

    // --- 게임 초기화 ---
    function resetGame() {
        localStorage.removeItem('beggarGameSave');
        location.reload();
    }

    // --- 1초마다 실행되는 함수 ---
    setInterval(function() {
        let totalHelperIncome = Math.floor(helperIncomes.reduce((a, b) => a + b, 0) * (1 + research.helperBoost/100));
        let totalHouseIncome = Math.floor(houseIncomes.reduce((a, b) => a + b, 0) * (1 + research.houseBoost/100));
        let totalSecIncome = Math.floor((totalHelperIncome + totalHouseIncome) * (1 + prestigeBonus/100) * buff.auto);
        money += totalSecIncome;

        // 로컬 랭킹 업데이트
        if (money > localRanking.maxMoney) {
            localRanking.maxMoney = money;
        }

        updateScreen();
        checkAchievements();
        saveGame();
    }, 1000);

    // --- 초기화 ---
    window.onload = function() {
        loadGame();
        checkDateAndResetMissions();
        updateScreen();
    };

    // --- 리셋 버튼 ---
    function resetGame() {
      localStorage.removeItem('beggarGameSave');
      location.reload();
    }
