import{V as P,W as z,a as $,r as g,x as C,g as F,s as q,i as Z,C as X,k as R,p as H,n as D,q as J,A as w,X as Q,c as E,d as U,m as ee}from"./index-EqKq1-V7.js";function te(){}const ze=Object.assign,ne=typeof window<"u",T=e=>e!==null&&typeof e=="object",h=e=>e!=null,A=e=>typeof e=="function",ue=e=>T(e)&&A(e.then)&&A(e.catch),V=e=>typeof e=="number"||/^\d+(\.\d+)?$/.test(e),oe=()=>ne?/ios|iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()):!1;function k(e,t){const n=t.split(".");let u=e;return n.forEach(o=>{var s;u=T(u)&&(s=u[o])!=null?s:""}),u}function He(e,t,n){return t.reduce((u,o)=>(u[o]=e[o],u),{})}const Ue=null,m=[Number,String],se={type:Boolean,default:!0},Ve=e=>({type:m,default:e}),O=e=>({type:String,default:e});var v=typeof window<"u";function S(e){return v?requestAnimationFrame(e):-1}function Ye(e){S(()=>S(e))}var re=e=>e===window,N=(e,t)=>({top:0,left:0,right:e,bottom:t,width:e,height:t}),ie=e=>{const t=w(e);if(re(t)){const n=t.innerWidth,u=t.innerHeight;return N(n,u)}return t!=null&&t.getBoundingClientRect?t.getBoundingClientRect():N(0,0)};function Ke(e){const t=P(e,null);if(t){const n=F(),{link:u,unlink:o,internalChildren:s}=t;u(n),z(()=>o(n));const c=$(()=>s.indexOf(n));return{parent:t,index:c}}return{parent:null,index:g(-1)}}function ae(e){const t=[],n=u=>{Array.isArray(u)&&u.forEach(o=>{var s;Q(o)&&(t.push(o),(s=o.component)!=null&&s.subTree&&(t.push(o.component.subTree),n(o.component.subTree.children)),o.children&&n(o.children))})};return n(e),t}var I=(e,t)=>{const n=e.indexOf(t);return n===-1?e.findIndex(u=>t.key!==void 0&&t.key!==null&&u.type===t.type&&u.key===t.key):n};function ce(e,t,n){const u=ae(e.subTree.children);n.sort((s,c)=>I(u,s.vnode)-I(u,c.vnode));const o=n.map(s=>s.proxy);t.sort((s,c)=>{const r=o.indexOf(s),i=o.indexOf(c);return r-i})}function Ge(e){const t=C([]),n=C([]),u=F();return{children:t,linkChildren:s=>{q(e,Object.assign({link:i=>{i.proxy&&(n.push(i),t.push(i.proxy),ce(u,t,n))},unlink:i=>{const a=n.indexOf(i);t.splice(a,1),n.splice(a,1)},children:t,internalChildren:n},s))}}}function le(e){let t;H(()=>{e(),D(()=>{t=!0})}),J(()=>{t&&e()})}function fe(e,t,n={}){if(!v)return;const{target:u=window,passive:o=!1,capture:s=!1}=n;let c=!1,r;const i=l=>{if(c)return;const f=w(l);f&&!r&&(f.addEventListener(e,t,{capture:s,passive:o}),r=!0)},a=l=>{if(c)return;const f=w(l);f&&r&&(f.removeEventListener(e,t,s),r=!1)};z(()=>a(u)),Z(()=>a(u)),le(()=>i(u));let p;return X(u)&&(p=R(u,(l,f)=>{a(f),i(l)})),()=>{p==null||p(),a(u),c=!0}}function qe(e,t,n={}){if(!v)return;const{eventName:u="click"}=n;fe(u,s=>{(Array.isArray(e)?e:[e]).every(i=>{const a=w(i);return a&&!a.contains(s.target)})&&t(s)},{target:document})}var B,b;function de(){if(!B&&(B=g(0),b=g(0),v)){const e=()=>{B.value=window.innerWidth,b.value=window.innerHeight};e(),window.addEventListener("resize",e,{passive:!0}),window.addEventListener("orientationchange",e,{passive:!0})}return{width:B,height:b}}var pe=/scroll|auto|overlay/i,ge=v?window:void 0;function Ee(e){return e.tagName!=="HTML"&&e.tagName!=="BODY"&&e.nodeType===1}function Ze(e,t=ge){let n=e;for(;n&&n!==t&&Ee(n);){const{overflowY:u}=window.getComputedStyle(n);if(pe.test(u))return n;n=n.parentNode}return t}oe();const he=e=>e.stopPropagation();function Xe(e,t){(typeof e.cancelable!="boolean"||e.cancelable)&&e.preventDefault(),t&&he(e)}const{width:me,height:ve}=de();function d(e){if(h(e))return V(e)?`${e}px`:String(e)}function Je(e){if(h(e)){if(Array.isArray(e))return{width:d(e[0]),height:d(e[1])};const t=d(e);return{width:t,height:t}}}function Qe(e){const t={};return e!==void 0&&(t.zIndex=+e),t}const ye=/-(\w)/g,Y=e=>e.replace(ye,(t,n)=>n.toUpperCase()),et=(e,t,n)=>Math.min(Math.max(e,t),n),{hasOwnProperty:Be}=Object.prototype;function we(e,t,n){const u=t[n];h(u)&&(!Be.call(e,n)||!T(u)?e[n]=u:e[n]=K(Object(e[n]),u))}function K(e,t){return Object.keys(t).forEach(n=>{we(e,t,n)}),e}var be={name:"姓名",tel:"电话",save:"保存",clear:"清空",cancel:"取消",confirm:"确认",delete:"删除",loading:"加载中...",noCoupon:"暂无优惠券",nameEmpty:"请填写姓名",addContact:"添加联系人",telInvalid:"请填写正确的电话",vanCalendar:{end:"结束",start:"开始",title:"日期选择",weekdays:["日","一","二","三","四","五","六"],monthTitle:(e,t)=>`${e}年${t}月`,rangePrompt:e=>`最多选择 ${e} 天`},vanCascader:{select:"请选择"},vanPagination:{prev:"上一页",next:"下一页"},vanPullRefresh:{pulling:"下拉即可刷新...",loosing:"释放即可刷新..."},vanSubmitBar:{label:"合计:"},vanCoupon:{unlimited:"无门槛",discount:e=>`${e}折`,condition:e=>`满${e}元可用`},vanCouponCell:{title:"优惠券",count:e=>`${e}张可用`},vanCouponList:{exchange:"兑换",close:"不使用",enable:"可用",disabled:"不可用",placeholder:"输入优惠码"},vanAddressEdit:{area:"地区",areaEmpty:"请选择地区",addressEmpty:"请填写详细地址",addressDetail:"详细地址",defaultAddress:"设为默认收货地址"},vanAddressList:{add:"新增地址"}};const L=g("zh-CN"),M=C({"zh-CN":be}),Ce={messages(){return M[L.value]},use(e,t){L.value=e,this.add({[e]:t})},add(e={}){K(M,e)}};var De=Ce;function Ae(e){const t=Y(e)+".";return(n,...u)=>{const o=De.messages(),s=k(o,t+n)||k(o,n);return A(s)?s(...u):s}}function x(e,t){return t?typeof t=="string"?` ${e}--${t}`:Array.isArray(t)?t.reduce((n,u)=>n+x(e,u),""):Object.keys(t).reduce((n,u)=>n+(t[u]?x(e,u):""),""):""}function Oe(e){return(t,n)=>(t&&typeof t!="string"&&(n=t,t=""),t=t?`${e}__${t}`:e,`${t}${x(t,n)}`)}function _(e){const t=`van-${e}`;return[t,Oe(t),Ae(t)]}const y="van-hairline",tt=`${y}--top`,nt=`${y}--left`,ut=`${y}--bottom`,ot=`${y}--surround`,st=`${y}--top-bottom`,rt="van-haptics-feedback",it=5;function at(e,{args:t=[],done:n,canceled:u,error:o}){if(e){const s=e.apply(null,t);ue(s)?s.then(c=>{c?n():u&&u()}).catch(o||te):s?n():u&&u()}else n()}function G(e){return e.install=t=>{const{name:n}=e;n&&(t.component(n,e),t.component(Y(`-${n}`),e))},e}const xe=Symbol();function Pe(e){const t=P(xe,null);t&&R(t,n=>{n&&e()})}const $e=(e,t)=>{const n=g(),u=()=>{n.value=ie(e).height};return H(()=>{D(u);for(let o=1;o<=3;o++)setTimeout(u,100*o)}),Pe(()=>D(u)),R([me,ve],u),n};function ct(e,t){const n=$e(e);return u=>E("div",{class:t("placeholder"),style:{height:n.value?`${n.value}px`:void 0}},[u()])}const lt={to:[String,Object],url:String,replace:Boolean};function Fe({to:e,url:t,replace:n,$router:u}){e&&u?u[n?"replace":"push"](e):t&&(n?location.replace(t):location.href=t)}function ft(){const e=F().proxy;return()=>Fe(e)}const[Re,j]=_("badge"),Te={dot:Boolean,max:m,tag:O("div"),color:String,offset:Array,content:m,showZero:se,position:O("top-right")};var _e=U({name:Re,props:Te,setup(e,{slots:t}){const n=()=>{if(t.content)return!0;const{content:r,showZero:i}=e;return h(r)&&r!==""&&(i||r!==0&&r!=="0")},u=()=>{const{dot:r,max:i,content:a}=e;if(!r&&n())return t.content?t.content():h(i)&&V(a)&&+a>+i?`${i}+`:a},o=r=>r.startsWith("-")?r.replace("-",""):`-${r}`,s=$(()=>{const r={background:e.color};if(e.offset){const[i,a]=e.offset,{position:p}=e,[l,f]=p.split("-");t.default?(typeof a=="number"?r[l]=d(l==="top"?a:-a):r[l]=l==="top"?d(a):o(a),typeof i=="number"?r[f]=d(f==="left"?i:-i):r[f]=f==="left"?d(i):o(i)):(r.marginTop=d(a),r.marginLeft=d(i))}return r}),c=()=>{if(n()||e.dot)return E("div",{class:j([e.position,{dot:e.dot,fixed:!!t.default}]),style:s.value},[u()])};return()=>{if(t.default){const{tag:r}=e;return E(r,{class:j("wrapper")},{default:()=>[t.default(),c()]})}return c()}}});const ke=G(_e),[Se,dt]=_("config-provider"),Ne=Symbol(Se),[Ie,W]=_("icon"),Le=e=>e==null?void 0:e.includes("/"),Me={dot:Boolean,tag:O("i"),name:String,size:m,badge:m,color:String,badgeProps:Object,classPrefix:String};var je=U({name:Ie,props:Me,setup(e,{slots:t}){const n=P(Ne,null),u=$(()=>e.classPrefix||(n==null?void 0:n.iconPrefix)||W());return()=>{const{tag:o,dot:s,name:c,size:r,badge:i,color:a}=e,p=Le(c);return E(ke,ee({dot:s,tag:o,class:[u.value,p?"":`${u.value}-${c}`],style:{color:a,fontSize:d(r)},content:i},e.badgeProps),{default:()=>{var l;return[(l=t.default)==null?void 0:l.call(t),p&&E("img",{class:W("image"),src:c},null)]}})}}});const pt=G(je);export{S as A,st as B,He as C,te as D,A as E,nt as F,tt as G,rt as H,pt as I,ne as J,ut as K,qe as L,ie as M,et as N,xe as P,it as T,ct as a,at as b,_ as c,ft as d,ze as e,Ke as f,Qe as g,ke as h,T as i,Je as j,O as k,d as l,Ve as m,m as n,ot as o,Xe as p,Ue as q,lt as r,le as s,se as t,Ge as u,Ze as v,G as w,fe as x,h as y,Ye as z};
