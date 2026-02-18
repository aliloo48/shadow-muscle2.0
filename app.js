/**
 * SHADOW MUSCLE - SYSTEM ENGINE v4.0
 * Thème : Solo Leveling / RPG
 */
class ShadowMuscle {
    constructor() {
        this.initData(); // load saved data (including custom missions)
        this.init(); // start app logic
    }

    initData() {
        const saved = localStorage.getItem('shadow_muscle_save');
        if (saved) {
            try {
                this.data = JSON.parse(saved);
            } catch (e) {
                console.warn('ShadowMuscle: failed to parse saved data, resetting.', e);
                localStorage.removeItem('shadow_muscle_save');
                this.data = null;
            }
        }

        if (!this.data) {
            this.data = {
                level: 1,
                xp: 0,
                stats: {
                    force: 10,
                    endurance: 10,
                    mental: 10,
                    discipline: 10,
                    aura: 10
                },
                streak: 0,
                lastDate: null,
                badges: [],
                history: [],
                customMissions: []
            };
        }

        this.data.customMissions = this.data.customMissions || [];

        this.BADGES_DB = [
            { id: 'first_step', name: 'Éveil', desc: 'Première mission complétée', icon: '⚔️', type: 'mission', req: 1 },
            { id: 'bronze_rank', name: 'Rank E', desc: 'Atteindre le niveau 5', icon: '🥉', type: 'level', req: 5 },
            { id: 'silver_rank', name: 'Rank C', desc: 'Atteindre le niveau 15', icon: '🥈', type: 'level', req: 15 },
            { id: 'gold_rank', name: 'Rank A', desc: 'Atteindre le niveau 30', icon: '🥇', type: 'level', req: 30 },
            { id: 'shadow_lord', name: 'Monarque', desc: 'Atteindre le niveau 50', icon: '👑', type: 'level', req: 50 },
            { id: 'consistent', name: 'Régularité', desc: 'Série de 7 jours', icon: '🔥', type: 'streak', req: 7 }
        ];

        this.MISSIONS = [
            { id: 'pompes', title: '20 Pompes', xp: 200, stat: 'force' },
            { id: 'squats', title: '30 Squats', xp: 200, stat: 'force' },
            { id: 'abdos', title: '30 Abdos', xp: 200, stat: 'discipline' },
            { id: 'gainage', title: '45s Gainage', xp: 200, stat: 'endurance' },
            { id: 'fentes', title: '20 Fentes (10/jambe)', xp: 200, stat: 'force' },
            { id: 'mountain', title: '30 Mountain Climbers', xp: 200, stat: 'endurance' }
        ];
    }

    init() {
        this.generateDailyMissions();
        this.weeklyMissions = [
            { id: 'hebdo_5jours', title: 'S' + 'é' + 'rie de 5 jours', xp: 1000, stat: 'discipline' }
        ];
        this.monthlyMissions = [
            { id: 'mensuel_30jours', title: 'S' + 'é' + 'rie de 30 jours', xp: 5000, stat: 'aura' }
        ];
        this.setupTabs();
        this.setupSubTabs();
        this.renderAll();
        this.setupEventListeners();
        this.checkStreak();
        this.requestNotify();
        console.log(\"System : Initialized. System: Arise.\");
    }

    setupTabs() {
        const nav = document.querySelector('.tab-nav');
        if (!nav) return;
        nav.addEventListener('click', e => {
            const btn = e.target.closest('.tab-btn');
            if (!btn) return;
            this.switchTab(btn.dataset.tab);
        });
    }

    switchTab(tabKey) {
        if (!tabKey) return;
        document.querySelectorAll('.tab-btn, .tab-panel').forEach(el => el.classList.remove('active'));
        const btn = document.querySelector(`.tab-btn[data-tab=\"${tabKey}\"]`);
        if (btn) btn.classList.add('active');
        const panel = document.getElementById('tab-' + tabKey);
        if (panel) panel.classList.add('active');
    }

    renderAll() {
        this.renderStatus();
        this.renderPortails();
        this.renderArtefacts();
        this.renderGrimoire();
    }

    renderStatus() {
        const levelEl = document.getElementById('currentLevel');
        if (levelEl) levelEl.textContent = this.data.level;
        const nextXP = this.data.level * 150;
        const percent = Math.min((this.data.xp / nextXP) * 100, 100);
        const progress = document.getElementById('xpProgress');
        if (progress) progress.style.width = percent + '%';
        const xpText = document.getElementById('xpText');
        if (xpText) xpText.textContent = `${this.data.xp} / ${nextXP} XP`;
        ['force','endurance','mental','discipline','aura'].forEach(stat => {
            const el = document.getElementById(stat);
            if (el) el.textContent = this.data.stats[stat] || 0;
        });
    }

    renderPortails() {
        const dailyDiv = document.getElementById('dailyMissions');
        if (dailyDiv) {
            dailyDiv.innerHTML = (this.dailyMissions || []).map(m => \`
                <div class=\"mission-card\">
                    <div class=\"mission-info\">
                        <span class=\"mission-title\">\${m.title}</span>
                        <span class=\"mission-xp\">+\${m.xp} XP</span>
                    </div>
                    <button class=\"btn-complete\" onclick=\"app.completeMission('\${m.id}')\">COMPLÉTER</button>
                </div>
            \`).join('');
        }
        const weeklyDiv = document.getElementById('weeklyMissions');
        if (weeklyDiv) {
            weeklyDiv.innerHTML = (this.weeklyMissions || []).map(m => \`
                <div class=\"mission-card\">
                    <div class=\"mission-info\">
                        <span class=\"mission-title\">\${m.title}</span>
                        <span class=\"mission-xp\">+\${m.xp} XP</span>
                    </div>
                    <button class=\"btn-complete\" onclick=\"app.completeMission('\${m.id}')\">COMPLÉTER</button>
                </div>
            \`).join('');
        }
        const monthlyDiv = document.getElementById('monthlyMissions');
        if (monthlyDiv) {
            monthlyDiv.innerHTML = (this.monthlyMissions || []).map(m => \`
                <div class=\"mission-card\">
                    <div class=\"mission-info\">
                        <span class=\"mission-title\">\${m.title}</span>
                        <span class=\"mission-xp\">+\${m.xp} XP</span>
                    </div>
                    <button class=\"btn-complete\" onclick=\"app.completeMission('\${m.id}')\">COMPLÉTER</button>
                </div>
            \`).join('');
        }
        const customDiv = document.getElementById('customMissions');
        if (customDiv) {
            customDiv.innerHTML = (this.data.customMissions || []).map((m, i) => \`
                <div class=\"mission-card\">
                    <div class=\"mission-info\">
                        <span class=\"mission-title\">\${m.title}\${m.xp ? \` (+\${m.xp} XP)\` : ''}</span>
                    </div>
                    <button class=\"btn-complete\" onclick=\"app.completeCustomMission(\${i})\">COMPLÉTER</button>
                </div>
            \`).join('');
        }
    }

    renderArtefacts() {
        const container = document.getElementById('badges-container') || document.getElementById('badgesContainer');
        if (container) {
            container.innerHTML = this.BADGES_DB.map(b => {
                const owned = this.data.badges.includes(b.id);
                return \`
                    <div class=\"badge-item \${owned ? 'owned' : 'locked'}\" title=\"\${b.desc}\">
                        <div class=\"badge-icon\">\${b.icon}</div>
                        <div class=\"badge-details\">
                            <span class=\"badge-name\">\${b.name}</span>
                            <span class=\"badge-desc\">\${b.desc}</span>
                        </div>
                    </div>
                \`;
            }).join('');
        }
    }

    renderGrimoire() {
        const container = document.getElementById('history-container') || document.getElementById('historyContainer');
        if (container) {
            container.innerHTML = this.data.history.slice(-14).reverse().map(h => \`
                <div class=\"history-item\">
                    <span class=\"history-date\">[\${h.date}]</span>
                    <span class=\"history-text\">\${h.text}</span>
                    <span class=\"history-xp\">+\${h.xp} XP</span>
                </div>
            \`).join('');
        }
    }

    generateDailyMissions() {
        const exercises = [
            { id: 'pompes', title: '20 Pompes', xp: 200, stat: 'force' },
            { id: 'pompes_diamant', title: '10 Pompes Diamant', xp: 220, stat: 'force' },
            { id: 'pompes_larges', title: '15 Pompes Larges', xp: 210, stat: 'force' },
            { id: 'squats', title: '30 Squats', xp: 200, stat: 'endurance' },
            { id: 'squats_sautes', title: '15 Squats Sautés', xp: 250, stat: 'endurance' },
            { id: 'fentes', title: '20 Fentes (10/jambe)', xp: 200, stat: 'force' },
            { id: 'gainage', title: '45 sec Gainage', xp: 200, stat: 'endurance' },
            { id: 'gainage_cote', title: '30 sec Gainage Côté', xp: 220, stat: 'endurance' },
            { id: 'mountain_climber', title: '30 Mountain Climbers', xp: 200, stat: 'endurance' },
            { id: 'burpees', title: '10 Burpees', xp: 300, stat: 'discipline' },
            { id: 'releve_jambes', title: '15 Relevés de jambes', xp: 200, stat: 'discipline' },
            { id: 'crunch', title: '25 Crunchs', xp: 200, stat: 'discipline' }
        ];
        this.dailyMissions = exercises.sort(() => Math.random() - 0.5).slice(0, 3);
    }

    completeMission(id) {
        let m = null;
        [this.dailyMissions, this.weeklyMissions, this.monthlyMissions].forEach(pool => {
            if (pool && !m) {
                const found = pool.find(x => x.id === id);
                if (found) m = found;
            }
        });
        if (!m) m = this.MISSIONS.find(x => x.id === id);
        if (!m) return;
        this.data.xp += m.xp;
        if (m.stat) this.data.stats[m.stat] = (this.data.stats[m.stat] || 0) + 1;
        this.addHistory('Mission accomplie : ' + m.title, m.xp);
        this.checkLevelUp();
        this.checkBadges();
        this.save();
        this.renderAll();
        this.showRPMessage('Mission accomplie. Vous avez gagné ' + m.xp + ' XP' + (m.stat ? ' et +1 en ' + m.stat : '') + '.');
    }

    checkLevelUp() {
        const nextXP = this.data.level * 150;
        if (this.data.xp >= nextXP) {
            this.data.level++;
            this.data.xp -= nextXP;
            Object.keys(this.data.stats).forEach(s => this.data.stats[s] += 2);
            this.showRPMessage('LEVEL UP ! Niveau ' + this.data.level + '. Vos limites ont été repoussées.');
            this.checkLevelUp();
        }
    }

    checkBadges() {
        this.BADGES_DB.forEach(b => {
            if (this.data.badges.includes(b.id)) return;
            let met = false;
            if (b.type === 'level' && this.data.level >= b.req) met = true;
            if (b.type === 'mission' && this.data.history.length >= b.req) met = true;
            if (b.type === 'streak' && this.data.streak >= b.req) met = true;
            if (met) {
                this.data.badges.push(b.id);
                this.showRPMessage('NOUVEL ARTEFACT : ' + b.name + ' ! ' + b.icon);
            }
        });
    }

    addHistory(text, xp) {
        const date = new Date().toLocaleDateString('fr-FR');
        this.data.history.push({ date, text, xp });
    }

    save() {
        localStorage.setItem('shadow_muscle_save', JSON.stringify(this.data));
    }

    checkStreak() {
        const today = new Date().toLocaleDateString();
        if (this.data.lastDate === today) return;
        this.data.streak++;
        this.data.lastDate = today;
        this.save();
    }

    showRPMessage(msg) {
        const div = document.createElement('div');
        div.className = 'rp-overlay';
        div.innerHTML = \`
            <div class=\"rp-modal\">
                <p>\${msg}</p>
                <button onclick=\"this.parentElement.parentElement.remove()\">ACCEPTER</button>
            </div>
        \`;
        document.body.appendChild(div);
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addMission');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const inp = document.getElementById('newMission');
                if (inp && inp.value.trim()) {
                    this.addCustomMission(inp.value);
                    inp.value = '';
                }
            });
        }
    }

    addCustomMission(text) {
        const id = 'custom_' + Date.now();
        this.data.customMissions.push({ id, title: text.trim(), xp: 0, stat: '' });
        this.save();
        this.renderPortails();
    }

    completeCustomMission(index) {
        const m = this.data.customMissions[index];
        if (!m) return;
        if (m.xp) this.data.xp += m.xp;
        if (m.stat) this.data.stats[m.stat] = (this.data.stats[m.stat] || 0) + 1;
        this.addHistory('Mission personnalisée : ' + m.title, m.xp || 0);
        this.data.customMissions.splice(index, 1);
        this.checkLevelUp();
        this.checkBadges();
        this.save();
        this.renderAll();
        this.showRPMessage('Mission personnalisée accomplie. Bravo !');
    }

    setupSubTabs() {
        const container = document.querySelector('.subtab-nav');
        if (!container) return;
        container.addEventListener('click', e => {
            const btn = e.target.closest('.subtab-btn');
            if (!btn) return;
            const key = btn.dataset.subtab;
            if (!key) return;
            container.querySelectorAll('.subtab-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected','false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected','true');
            document.querySelectorAll('.subtab-panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById('sub-' + key);
            if (panel) panel.classList.add('active');
        });
    }

    requestNotify() {
        if (\"Notification\" in window && Notification.permission === \"default\") {
            Notification.requestPermission();
        }
    }
}
const app = new ShadowMuscle();
window.app = app;
