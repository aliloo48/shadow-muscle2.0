/**
 * SHADOW MUSCLE - SYSTEM ENGINE v4.0
 * Thème : Solo Leveling / RPG
 */

class ShadowMuscle {
    constructor() {
        this.initData();               // load saved data (including custom missions)
        this.init();                   // start app logic
    }

    initData() {
        const saved = localStorage.getItem('shadow_muscle_save');
        if (saved) {
            try {
                this.data = JSON.parse(saved);
            } catch (e) {
                // corrupted save, drop it and start fresh
                console.warn('ShadowMuscle: failed to parse saved data, resetting.', e);
                localStorage.removeItem('shadow_muscle_save');
                this.data = null;
            }
        }

        if (!this.data) {
            this.data = {
                level: 1,
                xp: 0,
                stats: { force: 10, endurance: 10, mental: 10, discipline: 10, aura: 10 },
                streak: 0,
                lastDate: null,
                badges: [],
                history: [],
                customMissions: []         // user‑defined missions
            };
        }

        // ensure we always have a place for custom missions when reloading
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
            { id: 'pompes', title: '100 Pompes', xp: 40, stat: 'force' },
            { id: 'squats', title: '100 Squats', xp: 40, stat: 'force' },
            { id: 'abdos', title: '100 Abdos', xp: 40, stat: 'discipline' },
            { id: 'run', title: '10km Course', xp: 100, stat: 'endurance' },
            { id: 'lecture', title: 'Lecture 30min', xp: 30, stat: 'mental' },
            { id: 'meditation', title: 'Méditation 10min', xp: 30, stat: 'aura' }
        ];
    }

    init() {
        // prepare mission pools before rendering
        this.generateDailyMissions();
        // simple static weekly / monthly samples – could be replaced by more complex logic later
        this.weeklyMissions = [
            { id: 'hebdo_5jours', title: 'Fermer 5 jours consécutifs', xp: 150, stat: 'discipline' }
        ];
        this.monthlyMissions = [
            { id: 'mensuel_30jours', title: 'Fermer 30 jours consécutifs', xp: 500, stat: 'aura' }
        ];

        this.setupTabs();
        this.setupSubTabs();
        this.renderAll();
        this.setupEventListeners();
        this.checkStreak();
        this.requestNotify();
        console.log("System : Initialized. System: Arise.");
    }

    setupTabs() {
        // use delegation in case elements are replaced later; only one listener
        const nav = document.querySelector('.tab-nav');
        if (!nav) {
            console.warn('setupTabs: .tab-nav container not found');
            return;
        }
        nav.addEventListener('click', e => {
            const btn = e.target.closest('.tab-btn');
            if (!btn) return; // click outside a button
            const tabKey = btn.dataset.tab;
            console.log('ShadowMuscle: tab clicked ->', tabKey);
            if (!tabKey) return;
            document.querySelectorAll('.tab-btn, .tab-panel').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            const panel = document.getElementById('tab-' + tabKey);
            if (panel) panel.classList.add('active');
        });
    }

    renderAll() {
        this.renderStatus();
        this.renderPortails();
        this.renderArtefacts();
        this.renderGrimoire();
    }

    renderStatus() {
        // update level and rank
        const levelEl = document.getElementById('currentLevel');
        if (levelEl) levelEl.textContent = this.data.level;

        const rankEl = document.getElementById('rank');
        if (rankEl && this.data.rank) rankEl.textContent = this.data.rank;

        // xp bar
        const nextXP = this.data.level * 150;
        const percent = Math.min((this.data.xp / nextXP) * 100, 100);
        const progress = document.getElementById('xpProgress');
        if (progress) progress.style.width = percent + '%';
        const xpText = document.getElementById('xpText');
        if (xpText) xpText.textContent = `${this.data.xp} / ${nextXP} XP`;

        // individual stats
        ['force','endurance','mental','discipline','aura'].forEach(stat => {
            const el = document.getElementById(stat);
            if (el) el.textContent = this.data.stats[stat] || 0;
        });
    }

    renderPortails() {
        // populate each category container with appropriate missions
        const dailyDiv = document.getElementById('dailyMissions');
        if (dailyDiv) {
            dailyDiv.innerHTML = (this.dailyMissions || []).map(m =>
                `<div class="mission">
                    <span>${m.title} <span class="xp-badge">+${m.xp} XP</span></span>
                    <button class="mission-btn" onclick="app.completeMission('${m.id}')">COMPLÉTER</button>
                </div>`
            ).join('');
        }

        const weeklyDiv = document.getElementById('weeklyMissions');
        if (weeklyDiv) {
            weeklyDiv.innerHTML = (this.weeklyMissions || []).map(m =>
                `<div class="mission">
                    <span>${m.title} <span class="xp-badge">+${m.xp} XP</span></span>
                    <button class="mission-btn" onclick="app.completeWeeklyMission('${m.id}')">COMPLÉTER</button>
                </div>`
            ).join('');
        }

        const monthlyDiv = document.getElementById('monthlyMissions');
        if (monthlyDiv) {
            monthlyDiv.innerHTML = (this.monthlyMissions || []).map(m =>
                `<div class="mission">
                    <span>${m.title} <span class="xp-badge">+${m.xp} XP</span></span>
                    <button class="mission-btn" onclick="app.completeMonthlyMission('${m.id}')">COMPLÉTER</button>
                </div>`
            ).join('');
        }

        const customDiv = document.getElementById('customMissions');
        if (customDiv) {
            customDiv.innerHTML = (this.data.customMissions || []).map((m, i) =>
                `<div class="mission">
                    <span>${m.title}${m.xp ? ` <span class="xp-badge">+${m.xp} XP</span>` : ''}</span>
                    <button class="mission-btn" onclick="app.completeCustomMission(${i})">COMPLÉTER</button>
                </div>`
            ).join('');
        }
    }

    renderArtefacts() {
        // some HTML versions use camelCase IDs – support both for backwards compatibility
        const container = document.getElementById('badges-container') || document.getElementById('badgesContainer');
        if (container) {
            container.innerHTML = this.BADGES_DB.map(b => {
                const owned = this.data.badges.includes(b.id);
                return '<div class="artefact-card ' + (owned ? '' : 'locked') + '"><div class="artefact-icon">' + b.icon + '</div>' +
                       '<div class="artefact-name">' + b.name + '</div><div class="artefact-desc">' + b.desc + '</div></div>';
            }).join('');
        }
    }

    renderGrimoire() {
        const container = document.getElementById('history-container') || document.getElementById('historyContainer');
        if (container) {
            container.innerHTML = this.data.history.slice(-14).reverse().map(h => 
                '<div class="history-item"><span>[' + h.date + ']</span><span>' + h.text + '</span><span style="color:var(--neon-blue)">+' + h.xp + ' XP</span></div>'
            ).join('');
        }
    }

    // ---------- mission helper methods ----------
    generateDailyMissions() {
        // pick 3 random items from a pool of exercises
        const exercises = [
            { id: 'pompes', title: '100 Pompes', xp: 40, stat: 'force' },
            { id: '30pompes', title: '30 Pompes explosives', xp: 45, stat: 'force' },
            { id: 'onehand', title: '100 Pompes à une main', xp: 80, stat: 'force' },
            { id: 'squats', title: '100 Squats', xp: 40, stat: 'endurance' },
            { id: '50squats', title: '50 Squats profonds', xp: 50, stat: 'endurance' },
            { id: '200squats', title: '200 Squats', xp: 70, stat: 'endurance' },
            { id: 'meditation', title: '30 min Méditation', xp: 30, stat: 'mental' },
            { id: 'lecture', title: 'Lecture 30min', xp: 30, stat: 'mental' },
            { id: 'yoga', title: '30 min Yoga', xp: 35, stat: 'mental' },
            { id: 'shadowboxing', title: '20 min Shadow Boxing', xp: 60, stat: 'discipline' },
            { id: 'sparring', title: '30 min Sparring', xp: 70, stat: 'discipline' },
            { id: 'cardio', title: '15 min Cardio intensif', xp: 55, stat: 'endurance' },
            { id: 'fullbody', title: 'Full Body Workout', xp: 90, stat: 'force' },
            { id: 'morningchallenge', title: 'Défi matinal', xp: 65, stat: 'discipline' }
        ];
        this.dailyMissions = exercises.sort(() => Math.random() - 0.5).slice(0, 3);
    }

    completeWeeklyMission(id) {
        const idx = (this.weeklyMissions || []).findIndex(m => m.id === id);
        if (idx === -1) return;
        const m = this.weeklyMissions[idx];
        this.data.xp += m.xp;
        this.data.stats[m.stat] = (this.data.stats[m.stat] || 0) + 1;
        this.addHistory('Mission hebdo : ' + m.title, m.xp);
        // remove so it doesn't show again
        this.weeklyMissions.splice(idx, 1);
        this.checkLevelUp();
        this.checkBadges();
        this.save();
        this.renderAll();
        this.showRPMessage('Mission hebdo accomplie ! +' + m.xp + ' XP.');
    }

    completeMonthlyMission(id) {
        const idx = (this.monthlyMissions || []).findIndex(m => m.id === id);
        if (idx === -1) return;
        const m = this.monthlyMissions[idx];
        this.data.xp += m.xp;
        this.data.stats[m.stat] = (this.data.stats[m.stat] || 0) + 1;
        this.addHistory('Défi mensuel : ' + m.title, m.xp);
        this.monthlyMissions.splice(idx, 1);
        this.checkLevelUp();
        this.checkBadges();
        this.save();
        this.renderAll();
        this.showRPMessage('Défi mensuel accompli ! +' + m.xp + ' XP.');
    }

    completeCustomMission(index) {
        const m = this.data.customMissions[index];
        if (!m) return;
        if (m.xp) this.data.xp += m.xp;
        if (m.stat) this.data.stats[m.stat] = (this.data.stats[m.stat] || 0) + 1;
        this.addHistory('Mission personnalisée : ' + m.title, m.xp || 0);
        // remove custom mission after completion
        this.data.customMissions.splice(index, 1);
        this.checkLevelUp();
        this.checkBadges();
        this.save();
        this.renderAll();
        this.showRPMessage('Mission personnalisée accomplie. Bravo !');
    }

    addCustomMission(text) {
        const id = 'custom_' + Date.now();
        this.data.customMissions.push({ id, title: text.trim(), xp: 0, stat: '' });
        this.save();
        this.renderPortails();
    }

    completeMission(id) {
        // look for mission in any active pool (daily, weekly, monthly, default list)
        let m = null;
        [this.dailyMissions, this.weeklyMissions, this.monthlyMissions].forEach(pool => {
            if (pool && !m) {
                const found = pool.find(x => x.id === id);
                if (found) m = found;
            }
        });
        if (!m) {
            m = this.MISSIONS.find(x => x.id === id);
        }
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
        div.innerHTML = '<div class="rp-box"><p>' + msg + '</p><button onclick="this.parentElement.parentElement.remove()">ACCEPTER</button></div>';
        document.body.appendChild(div);
    }

    setupEventListeners() {
        // add custom mission button
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

    setupSubTabs() {
        const container = document.querySelector('.subtab-nav');
        if (!container) return; // no secondary tabs present
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
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }
}

const app = new ShadowMuscle();
// we keep a reference on window so inline handlers work and debugging is easier
window.app = app;
