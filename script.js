(function(){
    "use strict";

    // --- State ---
    let currentMode = 'standard';
    let expression = '';
    let result = '0';
    let history = [];
    let memory = 0;
    let resetDisplayOnNext = false;
    let scientificDeg = true; // true = deg, false = rad

    // DOM elements
    const exprEl = document.getElementById('expressionDisplay');
    const resEl = document.getElementById('resultDisplay');
    const dynamicPanel = document.getElementById('dynamicPanel');
    const historyList = document.getElementById('historyList');
    const memoryIndicator = document.getElementById('memoryIndicator');
    const modeBtns = document.querySelectorAll('.mode-btn');

    // --- Helpers ---
    function updateDisplay() {
        exprEl.textContent = expression || ' ';
        resEl.textContent = result;
    }

    function addHistory(entry) {
        history.unshift(entry);
        if (history.length > 20) history.pop();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            historyList.innerHTML = '<li style="color:#aaa; text-align:center; list-style:none;">Belum ada riwayat</li>';
            return;
        }
        historyList.innerHTML = history.map(item => 
            `<li data-expr="${item.expr}" data-res="${item.res}">${item.expr} = ${item.res}</li>`
        ).join('');
        document.querySelectorAll('.history-list li[data-expr]').forEach(li => {
            li.addEventListener('click', () => {
                const expr = li.dataset.expr;
                const res = li.dataset.res;
                expression = expr;
                result = res;
                resetDisplayOnNext = false;
                updateDisplay();
            });
        });
    }

    function updateMemoryUI() {
        memoryIndicator.textContent = `Memori: ${memory}`;
    }

    function memoryAdd(val) { memory += val; updateMemoryUI(); }
    function memorySubtract(val) { memory -= val; updateMemoryUI(); }
    function memoryRecall() { 
        result = memory.toString();
        expression = '';
        resetDisplayOnNext = true;
        updateDisplay();
    }
    function memoryClear() { memory = 0; updateMemoryUI(); }

    function evaluateExpression(expr) {
        try {
            let sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/%/g, '/100');
            let evalResult = Function('"use strict"; return (' + sanitized + ')')();
            return evalResult;
        } catch {
            return 'Error';
        }
    }

    function handleStandardInput(value) {
        if (value === 'AC') {
            expression = '';
            result = '0';
            resetDisplayOnNext = false;
        } else if (value === 'C') {
            expression = expression.slice(0, -1);
            if (expression === '') result = '0';
            else result = evaluateExpression(expression).toString();
        } else if (value === '=') {
            if (expression) {
                const resVal = evaluateExpression(expression);
                addHistory({ expr: expression, res: resVal.toString() });
                result = resVal.toString();
                expression = result;
                resetDisplayOnNext = true;
            }
        } else if (['+','-','×','÷','%'].includes(value)) {
            if (resetDisplayOnNext) {
                expression = result;
                resetDisplayOnNext = false;
            }
            expression += value;
            result = evaluateExpression(expression).toString();
        } else {
            if (resetDisplayOnNext) {
                expression = '';
                resetDisplayOnNext = false;
            }
            expression += value;
            result = evaluateExpression(expression).toString();
        }
        updateDisplay();
    }

    function sciCalc(func) {
        let val = parseFloat(result);
        if (isNaN(val)) return;
        let res;
        const toRad = scientificDeg ? (val * Math.PI / 180) : val;
        switch(func) {
            case 'sin': res = Math.sin(toRad); break;
            case 'cos': res = Math.cos(toRad); break;
            case 'tan': res = Math.tan(toRad); break;
            case 'asin': res = Math.asin(val) * (scientificDeg ? 180/Math.PI : 1); break;
            case 'acos': res = Math.acos(val) * (scientificDeg ? 180/Math.PI : 1); break;
            case 'atan': res = Math.atan(val) * (scientificDeg ? 180/Math.PI : 1); break;
            case 'log': res = Math.log10(val); break;
            case 'ln': res = Math.log(val); break;
            case 'sqrt': res = Math.sqrt(val); break;
            case 'square': res = val*val; break;
            case 'cube': res = val*val*val; break;
            case 'fact': 
                if (val < 0 || !Number.isInteger(val)) { res = 'Error'; break; }
                let f=1; for(let i=2;i<=val;i++) f*=i; res = f; break;
            case 'pi': res = Math.PI; break;
            case 'e': res = Math.E; break;
            default: return;
        }
        result = res.toString();
        expression = '';
        resetDisplayOnNext = true;
        updateDisplay();
    }

    function renderPanel() {
        let html = '';
        if (currentMode === 'standard') {
            html = `<div class="keypad-grid">
                ${['MC','M+','M-','MR','C','⌫','%','÷','7','8','9','×','4','5','6','-','1','2','3','+','0','.','⌫','='].map(k => {
                    let cls = 'calc-btn'; if(['=','+','-','×','÷'].includes(k)) cls += ' btn-black';
                    if(k==='⌫') return `<button class="calc-btn" data-key="C">⌫</button>`;
                    return `<button class="calc-btn" data-key="${k}">${k}</button>`;
                }).join('')}
            </div>`;
        } else if (currentMode === 'scientific') {
            html = `<div class="keypad-grid" style="grid-template-columns: repeat(5,1fr);">
                ${['sin','cos','tan','π','e','asin','acos','atan','x²','x³','√','log','ln','n!','Deg','Rad','(',')','^','C','7','8','9','÷','4','5','6','×','1','2','3','-','0','.','⌫','='].map(k => {
                    let cls = 'calc-btn'; if(['=','+','-','×','÷'].includes(k)) cls += ' btn-black';
                    if(k==='⌫') return `<button class="calc-btn" data-key="C">⌫</button>`;
                    if(k==='Deg') return `<button class="calc-btn" data-key="deg">Deg</button>`;
                    if(k==='Rad') return `<button class="calc-btn" data-key="rad">Rad</button>`;
                    return `<button class="calc-btn" data-key="${k}">${k}</button>`;
                }).join('')}
            </div><div style="margin-top:12px; color:#555;">Mode sudut: ${scientificDeg?'Deg':'Rad'}</div>`;
        } else if (currentMode === 'financial') {
            html = `<div style="display:flex; flex-direction:column; gap:16px;">
                <div class="form-group"><label>Pokok Pinjaman</label><input id="loanP" class="form-control" value="100000000"></div>
                <div class="form-group"><label>Bunga (%) per tahun</label><input id="loanR" class="form-control" value="8"></div>
                <div class="form-group"><label>Tenor (tahun)</label><input id="loanY" class="form-control" value="5"></div>
                <button id="calcLoan" class="btn-outline" style="padding:14px;">Hitung Cicilan</button>
                <div id="loanResult" class="result-badge">-</div>
                <hr><div>Bunga Majemuk / Investasi (coming soon)</div>
            </div>`;
        } else if (currentMode === 'health') {
            html = `<div><div class="form-group"><label>Berat (kg)</label><input id="bmiW" class="form-control" value="70"></div>
            <div class="form-group"><label>Tinggi (cm)</label><input id="bmiH" class="form-control" value="170"></div>
            <button id="calcBMI" class="btn-outline">Hitung BMI</button>
            <div id="bmiResult" class="result-badge">-</div></div>`;
        } else if (currentMode === 'convert') {
            html = `<div><select id="convType" class="form-control"><option value="length">Panjang</option><option value="temp">Suhu</option></select>
                <div class="unit-row"><input id="convVal" class="form-control" value="1"><span>→</span><input id="convResult" class="form-control" readonly></div>
                <button id="doConvert" class="btn-outline">Konversi</button></div>`;
        } else if (currentMode === 'tax') {
            html = `<div class="form-group"><label>Harga</label><input id="price" class="form-control" value="100000"></div>
            <div class="form-group"><label>PPN (%)</label><input id="ppnRate" class="form-control" value="11"></div>
            <button id="calcTax" class="btn-outline">Hitung Total + PPN</button><div id="taxResult" class="result-badge">-</div>`;
        } else if (currentMode === 'engineering') {
            html = `<div class="form-group"><label>V (volt)</label><input id="volt" class="form-control" value="220"></div>
            <div class="form-group"><label>I (ampere)</label><input id="curr" class="form-control" value="5"></div>
            <button id="calcPower" class="btn-outline">Hitung Daya (Watt)</button><div id="powerResult" class="result-badge">-</div>`;
        }
        dynamicPanel.innerHTML = html;
        attachModeListeners();
    }

    function attachModeListeners() {
        if (currentMode === 'standard' || currentMode === 'scientific') {
            document.querySelectorAll('.calc-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    let key = btn.dataset.key;
                    if (currentMode === 'scientific') {
                        if (['sin','cos','tan','asin','acos','atan','log','ln','sqrt'].includes(key)) sciCalc(key);
                        else if (key === 'x²') sciCalc('square');
                        else if (key === 'x³') sciCalc('cube');
                        else if (key === 'n!') sciCalc('fact');
                        else if (key === 'π') sciCalc('pi');
                        else if (key === 'e') sciCalc('e');
                        else if (key === 'deg') { scientificDeg = true; renderPanel(); }
                        else if (key === 'rad') { scientificDeg = false; renderPanel(); }
                        else handleStandardInput(key);
                    } else {
                        if (key === 'MC') memoryClear();
                        else if (key === 'M+') memoryAdd(parseFloat(result)||0);
                        else if (key === 'M-') memorySubtract(parseFloat(result)||0);
                        else if (key === 'MR') memoryRecall();
                        else handleStandardInput(key);
                    }
                    updateDisplay();
                });
            });
        }
        if (currentMode === 'financial') {
            document.getElementById('calcLoan')?.addEventListener('click', ()=>{
                let P = parseFloat(document.getElementById('loanP').value);
                let r = parseFloat(document.getElementById('loanR').value)/100/12;
                let n = parseFloat(document.getElementById('loanY').value)*12;
                let pmt = (P*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
                document.getElementById('loanResult').textContent = `Rp ${pmt.toFixed(0)}/bulan`;
            });
        }
        if (currentMode === 'health') {
            document.getElementById('calcBMI')?.addEventListener('click', ()=>{
                let w = parseFloat(document.getElementById('bmiW').value);
                let h = parseFloat(document.getElementById('bmiH').value)/100;
                let bmi = w/(h*h);
                let cat = bmi<18.5?'Kurus':bmi<25?'Normal':bmi<30?'Gemuk':'Obesitas';
                document.getElementById('bmiResult').textContent = `BMI: ${bmi.toFixed(1)} (${cat})`;
            });
        }
        if (currentMode === 'convert') {
            document.getElementById('doConvert')?.addEventListener('click', ()=>{
                let val = parseFloat(document.getElementById('convVal').value);
                // simplified conversion demo
                document.getElementById('convResult').value = (val * 100).toString(); 
            });
        }
        if (currentMode === 'tax') {
            document.getElementById('calcTax')?.addEventListener('click', ()=>{
                let price = parseFloat(document.getElementById('price').value);
                let ppn = parseFloat(document.getElementById('ppnRate').value);
                let total = price * (1+ppn/100);
                document.getElementById('taxResult').textContent = `Total: Rp ${total.toFixed(0)}`;
            });
        }
        if (currentMode === 'engineering') {
            document.getElementById('calcPower')?.addEventListener('click', ()=>{
                let v = parseFloat(document.getElementById('volt').value);
                let i = parseFloat(document.getElementById('curr').value);
                document.getElementById('powerResult').textContent = `Daya: ${(v*i).toFixed(2)} Watt`;
            });
        }
    }

    // Mode switching
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            expression = ''; result = '0'; updateDisplay();
            renderPanel();
        });
    });

    // History & Memory
    document.getElementById('clearHistoryBtn').addEventListener('click', ()=>{ history = []; renderHistory(); });
    document.getElementById('mcBtn').addEventListener('click', memoryClear);
    document.getElementById('mrBtn').addEventListener('click', memoryRecall);
    document.getElementById('mPlusBtn').addEventListener('click', ()=> memoryAdd(parseFloat(result)||0));
    document.getElementById('mMinusBtn').addEventListener('click', ()=> memorySubtract(parseFloat(result)||0));
    document.getElementById('exportTxtBtn').addEventListener('click', ()=>{
        let text = history.map(h=>`${h.expr} = ${h.res}`).join('\n');
        let blob = new Blob([text], {type: 'text/plain'});
        let a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'raven_history.txt'; a.click();
    });
    document.getElementById('exportPdfBtn').addEventListener('click', ()=> window.print());

    // Keyboard support
    window.addEventListener('keydown', (e) => {
        if (currentMode === 'standard' || currentMode === 'scientific') {
            const key = e.key;
            if ('0123456789.+-*/%'.includes(key)) {
                let mapped = key; if(key==='*') mapped='×'; if(key==='/') mapped='÷';
                handleStandardInput(mapped);
            } else if (key === 'Enter') handleStandardInput('=');
            else if (key === 'Backspace') handleStandardInput('C');
            else if (key === 'Escape') handleStandardInput('AC');
            updateDisplay();
        }
    });

    // Init
    renderPanel();
    updateMemoryUI();
    updateDisplay();
})();