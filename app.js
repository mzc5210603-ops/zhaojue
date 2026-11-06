/* ═══ PromptForge · 提示词锻造厂 ═══
   拨杆选配件 → 拉杆锻造 → 电报纸输出 */

(() => {
  "use strict";

  /* ---------- 配件库 ---------- */
  const MODULES = {
    role: {
      board: "board-role",
      items: [
        { name: "资深顾问", tpl: "你是一位拥有 15 年经验的行业资深顾问", desc: "稳重 · 靠谱" },
        { name: "创意总监", tpl: "你是一位拿过国际奖项的创意总监", desc: "大胆 · 跳脱" },
        { name: "技术专家", tpl: "你是一位精通前后端的技术专家", desc: "严谨 · 直给" },
        { name: "犀利编辑", tpl: "你是一位以毒舌著称的资深主编", desc: "挑剔 · 一针见血" },
        { name: "苏格拉底", tpl: "你是一位只提问、不下结论的苏格拉底式对话者", desc: "反问 · 引导" }
      ]
    },
    task: {
      board: "board-task",
      items: [
        { name: "方案策划", tpl: "请为以下需求设计三套差异化的执行方案，并各自列出优劣与成本", desc: "出选择题" },
        { name: "深度分析", tpl: "请对以下内容做结构化拆解：先给结论，再给三层论据，最后指出盲区", desc: "金字塔结构" },
        { name: "文案打磨", tpl: "请将以下文案改写三个版本：克制版、情绪版、神经病版", desc: "一稿三吃" },
        { name: "代码实现", tpl: "请给出可直接运行的完整代码，附关键注释与边界说明", desc: "拿来就能用" },
        { name: "学习路径", tpl: "请为零基础者规划一条 30 天可走完的学习路线，标注每日投入", desc: "按天拆解" }
      ]
    },
    style: {
      board: "board-style",
      items: [
        { name: "简明扼要", tpl: "风格要求：惜字如金，每段不超过三行", desc: "别啰嗦" },
        { name: "举例大师", tpl: "风格要求：每个观点必须配一个生活化的例子", desc: "听得懂" },
        { name: "层层追问", tpl: "风格要求：回答后主动反问我一个问题，推进思考", desc: "苏式对话" },
        { name: "表格呈现", tpl: "风格要求：能用表格呈现的信息一律用表格", desc: "扫一眼就懂" },
        { name: "讲给小白", tpl: "风格要求：假设读者只有初中文化，术语出现即解释", desc: "零门槛" }
      ]
    },
    constraint: {
      board: "board-constraint",
      items: [
        { name: "诚实条款", tpl: "约束：不确定的信息请直说「不确定」，禁止编造", desc: "防幻觉" },
        { name: "反共识", tpl: "约束：先给出大众观点，再给出一个合理的反共识观点", desc: "换个角度" },
        { name: "风险前置", tpl: "约束：先列这件事最可能翻车的三个点，再谈怎么做", desc: "先泼冷水" },
        { name: "百字限制", tpl: "约束：全文控制在 200 字以内，超出请自我删减", desc: "逼出密度" },
        { name: "行动收尾", tpl: "约束：结尾必须给出「今天就能做的第一步」", desc: "落地闭环" }
      ]
    }
  };

  const STATE = { role: null, task: null, style: null, constraint: null };
  const LS_KEY = "promptforge-v1";
  let forgedCount = 0;

  /* ---------- DOM ---------- */
  const $ = (id) => document.getElementById(id);
  const tape = $("tape"), lever = $("lever");
  const gNeedle = $("gNeedle"), gVal = $("gVal");

  /* ---------- 渲染拨杆 ---------- */
  function buildBoards() {
    Object.values(MODULES).forEach((group) => {
      const board = $(group.board);
      board.innerHTML = "";
      group.items.forEach((item, idx) => {
        const sw = document.createElement("div");
        sw.className = "switch";
        sw.innerHTML =
          '<span class="knobs"><span class="knob"></span><span class="knob"></span></span>' +
          '<span class="sw-name">' + item.name + "</span>" +
          '<span class="sw-desc">' + item.desc + "</span>";
        sw.addEventListener("click", () => toggle(group.board, item.name, sw));
        board.appendChild(sw);
        // 恢复上次选择
        if (saved[group.board] === item.name) {
          sw.classList.add("on");
          STATE[group.board.split("-")[1]] = item;
        }
      });
    });
  }

  function toggle(boardId, name, el) {
    const key = boardId.split("-")[1];
    const group = MODULES[key];
    const item = group.items.find((i) => i.name === name);
    const wasOn = el.classList.contains("on");
    el.parentElement.querySelectorAll(".switch").forEach((s) => s.classList.remove("on"));
    if (!wasOn) {
      el.classList.add("on");
      STATE[key] = item;
    } else {
      STATE[key] = null;
    }
    saved[boardId] = wasOn ? null : name;
    persist();
    updateGauge();
  }

  /* ---------- 炉压表 ---------- */
  function updateGauge() {
    const n = ["role", "task", "style", "constraint"].filter((k) => STATE[k]).length;
    const psi = n * 30;
    gVal.textContent = psi;
    gNeedle.style.transform =
      "translateX(-50%) rotate(" + (-120 + n * 60) + "deg)";
  }

  /* ---------- 锻造 ---------- */
  function forge() {
    if (lever.classList.contains("pulled")) return;

    const need = [];
    if (!STATE.role) need.push("角色");
    if (!STATE.task) need.push("任务");
    if (need.length) {
      tape.textContent = "【锻造失败】炉温不足：至少需要「角色」与「任务」两个模块。\n\n请回到左侧配电板扳下对应拨杆，再来拉动锻造拉杆。";
      return;
    }

    // 拉杆动画
    lever.classList.add("pulled");
    tape.classList.add("forging");
    tape.textContent = "▓▓▓ 蒸汽升压中 ▓▓▓\n锤断理不乱，正在回火……\n\n";

    setTimeout(() => {
      const parts = [];
      parts.push("【锻造完成 · 编号 No." + pad(++forgedCount) + "】\n");
      parts.push("── 角色铸模 ──\n" + STATE.role.tpl + "。");
      parts.push("── 任务锻件 ──\n" + STATE.task.tpl + "。");
      if (STATE.style) parts.push("── 风格淬火 ──\n" + STATE.style.tpl + "。");
      if (STATE.constraint) parts.push("── 约束铆钉 ──\n" + STATE.constraint.tpl + "。");
      parts.push("── 交付要求 ──\n以上模块合并为一段完整指令，直接发送给任意 AI 助手即可使用。");
      parts.push("\n（本提示词由 PromptForge 锻造厂出品，电报纸为凭）");

      tape.classList.remove("forging");
      tape.textContent = parts.join("\n\n");
      tape.scrollTop = 0;

      // 计数器
      const s = String(forgedCount % 1000).padStart(3, "0");
      $("cw1").textContent = s[0];
      $("cw2").textContent = s[1];
      $("cw3").textContent = s[2];
      persist();

      // 拉杆复位
      setTimeout(() => lever.classList.remove("pulled"), 700);
    }, 1300);
  }

  function pad(n) { return String(n).padStart(3, "0"); }

  /* ---------- 拓印 / 回炉 ---------- */
  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  $("copyBtn").addEventListener("click", async () => {
    if (tape.textContent.includes("锻造失败") || tape.textContent.includes("等待锻造")) {
      toast("⚒ 纸上无字，先拉杆锻造");
      return;
    }
    try {
      await navigator.clipboard.writeText(tape.textContent);
      toast("⚒ 已拓印到剪贴板");
    } catch (e) {
      // 降级方案
      const ta = document.createElement("textarea");
      ta.value = tape.textContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast("⚒ 已拓印到剪贴板");
    }
  });

  $("resetBtn").addEventListener("click", () => {
    Object.keys(STATE).forEach((k) => (STATE[k] = null));
    Object.keys(saved).forEach((k) => (saved[k] = null));
    persist();
    buildBoards();
    updateGauge();
    tape.textContent = "【等待锻造】拉动下方拉杆，开始锻造你的提示词…";
    toast("⚒ 已回炉重造");
  });

  lever.addEventListener("click", forge);

  /* ---------- 持久化 ---------- */
  let saved = {};
  function persist() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        saved,
        count: forgedCount
      }));
    } catch (e) {}
  }
  function restore() {
    try {
      const d = JSON.parse(localStorage.getItem(LS_KEY));
      if (d) {
        saved = d.saved || {};
        forgedCount = d.count || 0;
        const s = String(forgedCount % 1000).padStart(3, "0");
        $("cw1").textContent = s[0];
        $("cw2").textContent = s[1];
        $("cw3").textContent = s[2];
      }
    } catch (e) {}
  }

  /* ---------- 启动 ---------- */
  restore();
  buildBoards();
  updateGauge();
})();
