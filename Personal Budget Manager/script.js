let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let reminders = JSON.parse(localStorage.getItem('reminders')) || [];

const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const txnList = document.getElementById('txnList');
const remList = document.getElementById('remList');
const donutCtx = document.getElementById('donut').getContext('2d');
let donutChart;
const scaleCtx = document.getElementById('scale').getContext('2d');
let scaleChart;

const txnPeriodEl = document.getElementById('txnPeriod');
const catPeriodEl = document.getElementById('catPeriod');
const scalePeriodEl = document.getElementById('scalePeriod');
const summaryPeriodEl = document.getElementById('summaryPeriod');

const categoryColors = {
  salary:'#4caf50', business:'#2196f3', freelance:'#ff9800',
  shopping:'#9c27b0', entertainment:'#e91e63', medical:'#f44336',
  food:'#795548', travel:'#00bcd4', other:'#607d8b'
};

function getPeriodDates(period){
  const now=new Date(); let start,end;
  if(period==='thisMonth'){start=new Date(now.getFullYear(),now.getMonth(),1);end=new Date();}
  else if(period==='lastMonth'){start=new Date(now.getFullYear(),now.getMonth()-1,1);end=new Date(now.getFullYear(),now.getMonth(),0);}
  else if(period==='thisYear'){start=new Date(now.getFullYear(),0,1);end=new Date();}
  else if(period==='lastYear'){start=new Date(now.getFullYear()-1,0,1);end=new Date(now.getFullYear()-1,11,31);}
  else{start=new Date(0);end=new Date(9999,11,31);}
  return [start,end];
}

function updateSummary(){
  const [start,end]=getPeriodDates(summaryPeriodEl.value);
  let income=0,expense=0;
  transactions.forEach(t=>{
    const d=new Date(t.date);
    if(d>=start&&d<=end){t.type==='income'?income+=t.amount:expense+=t.amount;}
  });
  balanceEl.textContent='₹'+(income-expense);
  incomeEl.textContent='₹'+income;
  expenseEl.textContent='₹'+expense;
  updateCategoryChart();
  updateScaleChart();
}

summaryPeriodEl.addEventListener('change',updateSummary);

function updateCategoryChart(){
  const [start,end]=getPeriodDates(catPeriodEl.value);
  let catMap={};
  transactions.forEach(t=>{
    const d=new Date(t.date);
    if(d>=start&&d<=end){
      let key=t.type==='income'?'Income: '+t.category:'Expense: '+t.category;
      catMap[key]=(catMap[key]||0)+t.amount;
    }
  });
  const labels=Object.keys(catMap), data=Object.values(catMap);
  const colors=labels.map(l=>{
    const cat=l.split(': ')[1],type=l.split(': ')[0];
    return type==='Income'? '#4caf50':(categoryColors[cat]||'#d32f2f');
  });
  if(donutChart) donutChart.destroy();
  donutChart=new Chart(donutCtx,{
    type:'doughnut',
    data:{labels,datasets:[{data,backgroundColor:colors}]},
    options:{plugins:{legend:{position:'bottom'}}}
  });
}

function updateScaleChart(){
  const [start,end]=getPeriodDates(scalePeriodEl.value);
  let income=0,expense=0;
  transactions.forEach(t=>{
    const d=new Date(t.date);
    if(d>=start&&d<=end){t.type==='income'?income+=t.amount:expense+=t.amount;}
  });
  if(scaleChart) scaleChart.destroy();
  scaleChart=new Chart(scaleCtx,{
    type:'bar',
    data:{
      labels:['Income','Expense'],
      datasets:[{label:'₹ Amount',data:[income,expense],backgroundColor:['#4caf50','#d32f2f']}]
    },
    options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}
  });
}

function renderTransactions(){
  const [start,end]=getPeriodDates(txnPeriodEl.value);
  txnList.innerHTML='';
  transactions.forEach((t,i)=>{
    const d=new Date(t.date);
    if(d>=start&&d<=end){
      const div=document.createElement('div');div.className='txn';
      div.innerHTML=`
        <div class="left"><span class="chip">${t.category}</span>
          <div><div>${t.title}</div><div class="meta">${t.date}</div></div>
        </div>
        <div class="controls">
          <div class="${t.type==='income'?'green':'red'}">₹${t.amount}</div>
          <button onclick="deleteTransaction(${i})">🗑️</button>
        </div>`;
      txnList.appendChild(div);
    }
  });
}

function deleteTransaction(index){
  if(confirm('Delete this transaction?')){
    transactions.splice(index,1);
    localStorage.setItem('transactions',JSON.stringify(transactions));
    renderTransactions();
    updateSummary();
  }
}

document.getElementById('txnForm').addEventListener('submit',e=>{
  e.preventDefault();
  const t={
    title:document.getElementById('title').value,
    amount:Number(document.getElementById('amount').value),
    type:document.getElementById('type').value,
    category:document.getElementById('category').value,
    date:document.getElementById('date').value
  };
  transactions.push(t);
  localStorage.setItem('transactions',JSON.stringify(transactions));
  e.target.reset();
  updateSummary();
  renderTransactions();
});

function renderReminders(){
  remList.innerHTML='';
  reminders.forEach((r,i)=>{
    const div=document.createElement('div');div.className='reminder';
    div.innerHTML=`
      <div class="left">
        <span class="chip">${r.recurrence}</span>
        <div>
          <div>${r.title} ${r.amount? '₹'+r.amount : ''}</div>
          <div class="meta">Day ${r.day}</div>
        </div>
      </div>
      <div class="controls">
        <button onclick="deleteReminder(${i})">🗑️</button>
      </div>`;
    remList.appendChild(div);
  });
}

function deleteReminder(index){
  if(confirm('Delete this reminder?')){
    reminders.splice(index,1);
    localStorage.setItem('reminders',JSON.stringify(reminders));
    renderReminders();
  }
}

document.getElementById('reminderForm').addEventListener('submit',e=>{
  e.preventDefault();
  const r={
    title:document.getElementById('remTitle').value,
    amount:document.getElementById('remAmount').value,
    day:Number(document.getElementById('remDay').value),
    recurrence:document.getElementById('remRecurrence').value,
    paid:false
  };
  reminders.push(r);
  localStorage.setItem('reminders',JSON.stringify(reminders));
  e.target.reset();
  renderReminders();
});

txnPeriodEl.addEventListener('change',renderTransactions);
catPeriodEl.addEventListener('change',updateCategoryChart);
scalePeriodEl.addEventListener('change',updateSummary);

updateSummary();
renderTransactions();
renderReminders();
