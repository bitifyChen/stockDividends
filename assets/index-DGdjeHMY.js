import{_ as Be}from"./el-message-CPbFZw2B.js";import{e as X,n as p,t as T,j as q,T as ue,o as Le,k as $e,p as ae,c as E,l as oe,g as _e,q as A,w as N,s as G,P as Re,b as be,H as te,I as W,r as Ae,d as ze,u as Ee,B as Ne,f as He,v as Me,x as Ve,y as de,a as je,z as Fe,A as Ye,m as qe,C as We,D as Ke}from"./index-CUHdVU9J.js";import{g as ge,r as g,i as xe,j as Xe,k as Z,d as H,c as d,T as ye,l as J,v as le,a as C,n as ke,p as Ue,q as Ge,s as Ze,t as Je,F as K,m as ne,u as Qe,o as O,x as se,w as R,f as x,y as Y,z as Ce,A as et,E as tt,B as nt,C as at,b as z,e as we,D as L,G as ot,H as Se,_ as Ie,I as lt,J as st,K as fe,L as ct}from"./index-DrPfDYiT.js";function Q(e){const t=ge();t&&X(t.proxy,e)}let it=2e3;const rt=()=>++it,ut={show:Boolean,zIndex:p,overlay:T,duration:p,teleport:[String,Object],lockScroll:T,lazyRender:T,beforeClose:Function,overlayStyle:Object,overlayClass:q,transitionAppear:Boolean,closeOnClickOverlay:T};function dt(e,t){return e>t?"horizontal":t>e?"vertical":""}function Te(){const e=g(0),t=g(0),n=g(0),r=g(0),a=g(0),c=g(0),i=g(""),s=g(!0),u=()=>i.value==="vertical",o=()=>i.value==="horizontal",l=()=>{n.value=0,r.value=0,a.value=0,c.value=0,i.value="",s.value=!0};return{move:h=>{const _=h.touches[0];n.value=(_.clientX<0?0:_.clientX)-e.value,r.value=_.clientY-t.value,a.value=Math.abs(n.value),c.value=Math.abs(r.value);const v=10;(!i.value||a.value<v&&c.value<v)&&(i.value=dt(a.value,c.value)),s.value&&(a.value>ue||c.value>ue)&&(s.value=!1)},start:h=>{l(),e.value=h.touches[0].clientX,t.value=h.touches[0].clientY},reset:l,startX:e,startY:t,deltaX:n,deltaY:r,offsetX:a,offsetY:c,direction:i,isVertical:u,isHorizontal:o,isTap:s}}let F=0;const ve="van-overflow-hidden";function ft(e,t){const n=Te(),r="01",a="10",c=l=>{n.move(l);const m=n.deltaY.value>0?a:r,y=$e(l.target,e.value),{scrollHeight:h,offsetHeight:_,scrollTop:v}=y;let b="11";v===0?b=_>=h?"00":"01":v+_>=h&&(b="10"),b!=="11"&&n.isVertical()&&!(parseInt(b,2)&parseInt(m,2))&&ae(l,!0)},i=()=>{document.addEventListener("touchstart",n.start),document.addEventListener("touchmove",c,{passive:!1}),F||document.body.classList.add(ve),F++},s=()=>{F&&(document.removeEventListener("touchstart",n.start),document.removeEventListener("touchmove",c),F--,F||document.body.classList.remove(ve))},u=()=>t()&&i(),o=()=>t()&&s();Le(u),xe(o),Xe(o),Z(t,l=>{l?i():s()})}function ce(e){const t=g(!1);return Z(e,n=>{n&&(t.value=n)},{immediate:!0}),n=>()=>t.value?n():null}const me=()=>{var e;const{scopeId:t}=((e=ge())==null?void 0:e.vnode)||{};return t?{[t]:""}:null},[vt,mt]=E("overlay"),ht={show:Boolean,zIndex:p,duration:p,className:q,lockScroll:T,lazyRender:T,customStyle:Object};var _t=H({name:vt,props:ht,setup(e,{slots:t}){const n=g(),r=ce(()=>e.show||!e.lazyRender),a=i=>{e.lockScroll&&ae(i,!0)},c=r(()=>{var i;const s=X(_e(e.zIndex),e.customStyle);return A(e.duration)&&(s.animationDuration=`${e.duration}s`),J(d("div",{ref:n,style:s,class:[mt(),e.className]},[(i=t.default)==null?void 0:i.call(t)]),[[le,e.show]])});return oe("touchmove",a,{target:n}),()=>d(ye,{name:"van-fade",appear:!0},{default:c})}});const bt=N(_t),gt=X({},ut,{round:Boolean,position:G("center"),closeIcon:G("cross"),closeable:Boolean,transition:String,iconPrefix:String,closeOnPopstate:Boolean,closeIconPosition:G("top-right"),safeAreaInsetTop:Boolean,safeAreaInsetBottom:Boolean}),[xt,he]=E("popup");var yt=H({name:xt,inheritAttrs:!1,props:gt,emits:["open","close","opened","closed","keydown","update:show","clickOverlay","clickCloseIcon"],setup(e,{emit:t,attrs:n,slots:r}){let a,c;const i=g(),s=g(),u=ce(()=>e.show||!e.lazyRender),o=C(()=>{const k={zIndex:i.value};if(A(e.duration)){const P=e.position==="center"?"animationDuration":"transitionDuration";k[P]=`${e.duration}s`}return k}),l=()=>{a||(a=!0,i.value=e.zIndex!==void 0?+e.zIndex:rt(),t("open"))},m=()=>{a&&be(e.beforeClose,{done(){a=!1,t("close"),t("update:show",!1)}})},y=k=>{t("clickOverlay",k),e.closeOnClickOverlay&&m()},h=()=>{if(e.overlay)return d(bt,ne({show:e.show,class:e.overlayClass,zIndex:i.value,duration:e.duration,customStyle:e.overlayStyle,role:e.closeOnClickOverlay?"button":void 0,tabindex:e.closeOnClickOverlay?0:void 0},me(),{onClick:y}),{default:r["overlay-content"]})},_=k=>{t("clickCloseIcon",k),m()},v=()=>{if(e.closeable)return d(W,{role:"button",tabindex:0,name:e.closeIcon,class:[he("close-icon",e.closeIconPosition),te],classPrefix:e.iconPrefix,onClick:_},null)};let b;const w=()=>{b&&clearTimeout(b),b=setTimeout(()=>{t("opened")})},S=()=>t("closed"),$=k=>t("keydown",k),M=u(()=>{var k;const{round:P,position:f,safeAreaInsetTop:I,safeAreaInsetBottom:D}=e;return J(d("div",ne({ref:s,style:o.value,role:"dialog",tabindex:0,class:[he({round:P,[f]:f}),{"van-safe-area-top":I,"van-safe-area-bottom":D}],onKeydown:$},n,me()),[(k=r.default)==null?void 0:k.call(r),v()]),[[le,e.show]])}),j=()=>{const{position:k,transition:P,transitionAppear:f}=e,I=k==="center"?"van-fade":`van-popup-slide-${k}`;return d(ye,{name:P||I,appear:f,onAfterEnter:w,onAfterLeave:S},{default:M})};return Z(()=>e.show,k=>{k&&!a&&(l(),n.tabindex===0&&ke(()=>{var P;(P=s.value)==null||P.focus()})),!k&&a&&(a=!1,t("close"))}),Q({popupRef:s}),ft(s,()=>e.show&&e.lockScroll),oe("popstate",()=>{e.closeOnPopstate&&(m(),c=!1)}),Ue(()=>{e.show&&l()}),Ge(()=>{c&&(t("update:show",!0),c=!1)}),xe(()=>{e.show&&e.teleport&&(m(),c=!0)}),Ze(Re,()=>e.show),()=>e.teleport?d(Je,{to:e.teleport},{default:()=>[h(),j()]}):d(K,null,[h(),j()])}});const kt=N(yt),[Ct,V]=E("cell"),ie={tag:G("div"),icon:String,size:String,title:p,value:p,label:p,center:Boolean,isLink:Boolean,border:T,iconPrefix:String,valueClass:q,labelClass:q,titleClass:q,titleStyle:null,arrowDirection:String,required:{type:[Boolean,String],default:null},clickable:{type:Boolean,default:null}},wt=X({},ie,Ae);var St=H({name:Ct,props:wt,setup(e,{slots:t}){const n=ze(),r=()=>{if(t.label||A(e.label))return d("div",{class:[V("label"),e.labelClass]},[t.label?t.label():e.label])},a=()=>{var u;if(t.title||A(e.title)){const o=(u=t.title)==null?void 0:u.call(t);return Array.isArray(o)&&o.length===0?void 0:d("div",{class:[V("title"),e.titleClass],style:e.titleStyle},[o||d("span",null,[e.title]),r()])}},c=()=>{const u=t.value||t.default;if(u||A(e.value))return d("div",{class:[V("value"),e.valueClass]},[u?u():d("span",null,[e.value])])},i=()=>{if(t.icon)return t.icon();if(e.icon)return d(W,{name:e.icon,class:V("left-icon"),classPrefix:e.iconPrefix},null)},s=()=>{if(t["right-icon"])return t["right-icon"]();if(e.isLink){const u=e.arrowDirection&&e.arrowDirection!=="right"?`arrow-${e.arrowDirection}`:"arrow";return d(W,{name:u,class:V("right-icon")},null)}};return()=>{var u;const{tag:o,size:l,center:m,border:y,isLink:h,required:_}=e,v=(u=e.clickable)!=null?u:h,b={center:m,required:!!_,clickable:v,borderless:!y};return l&&(b[l]=!!l),d(o,{class:V(b),role:v?"button":void 0,tabindex:v?0:void 0,onClick:n},{default:()=>{var w;return[i(),a(),c(),s(),(w=t.extra)==null?void 0:w.call(t)]}})}}});const It=N(St),[Pe,Tt]=E("collapse"),pe=Symbol(Pe),Pt={border:T,accordion:Boolean,modelValue:{type:[String,Number,Array],default:""}};var pt=H({name:Pe,props:Pt,emits:["change","update:modelValue"],setup(e,{emit:t,slots:n}){const{linkChildren:r,children:a}=Ee(pe),c=o=>{t("change",o),t("update:modelValue",o)},i=(o,l)=>{const{accordion:m,modelValue:y}=e;c(m?o===y?"":o:l?y.concat(o):y.filter(h=>h!==o))},s=(o={})=>{if(e.accordion)return;typeof o=="boolean"&&(o={expanded:o});const{expanded:l,skipDisabled:m}=o,h=a.filter(_=>_.disabled&&m?_.expanded.value:l??!_.expanded.value).map(_=>_.itemName.value);c(h)},u=o=>{const{accordion:l,modelValue:m}=e;return l?m===o:m.includes(o)};return Q({toggleAll:s}),r({toggle:i,isExpanded:u}),()=>{var o;return d("div",{class:[Tt(),{[Ne]:e.border}]},[(o=n.default)==null?void 0:o.call(n)])}}});const Dt=N(pt),[Ot,U]=E("collapse-item"),Bt=["icon","title","value","label","right-icon"],Lt=X({},ie,{name:p,isLink:T,disabled:Boolean,readonly:Boolean,lazyRender:T});var $t=H({name:Ot,props:Lt,setup(e,{slots:t}){const n=g(),r=g(),{parent:a,index:c}=He(pe);if(!a)return;const i=C(()=>{var v;return(v=e.name)!=null?v:c.value}),s=C(()=>a.isExpanded(i.value)),u=g(s.value),o=ce(()=>u.value||!e.lazyRender),l=()=>{s.value?n.value&&(n.value.style.height=""):u.value=!1};Z(s,(v,b)=>{if(b===null)return;v&&(u.value=!0),(v?ke:Ve)(()=>{if(!r.value||!n.value)return;const{offsetHeight:S}=r.value;if(S){const $=`${S}px`;n.value.style.height=v?"0":$,Me(()=>{n.value&&(n.value.style.height=v?$:"0")})}else l()})});const m=(v=!s.value)=>{a.toggle(i.value,v)},y=()=>{!e.disabled&&!e.readonly&&m()},h=()=>{const{border:v,disabled:b,readonly:w}=e,S=de(e,Object.keys(ie));return w&&(S.isLink=!1),(b||w)&&(S.clickable=!1),d(It,ne({role:"button",class:U("title",{disabled:b,expanded:s.value,borderless:!v}),"aria-expanded":String(s.value),onClick:y},S),de(t,Bt))},_=o(()=>{var v;return J(d("div",{ref:n,class:U("wrapper"),onTransitionend:l},[d("div",{ref:r,class:U("content")},[(v=t.default)==null?void 0:v.call(t)])]),[[le,u.value]])});return Q({toggle:m,expanded:s,itemName:i}),()=>d("div",{class:[U({border:c.value&&e.border})]},[h(),_()])}});const Rt=N($t),[At,B]=E("nav-bar"),zt={title:String,fixed:Boolean,zIndex:p,border:T,leftText:String,rightText:String,leftDisabled:Boolean,rightDisabled:Boolean,leftArrow:Boolean,placeholder:Boolean,safeAreaInsetTop:Boolean,clickable:T};var Et=H({name:At,props:zt,emits:["clickLeft","clickRight"],setup(e,{emit:t,slots:n}){const r=g(),a=je(r,B),c=l=>{e.leftDisabled||t("clickLeft",l)},i=l=>{e.rightDisabled||t("clickRight",l)},s=()=>n.left?n.left():[e.leftArrow&&d(W,{class:B("arrow"),name:"arrow-left"},null),e.leftText&&d("span",{class:B("text")},[e.leftText])],u=()=>n.right?n.right():d("span",{class:B("text")},[e.rightText]),o=()=>{const{title:l,fixed:m,border:y,zIndex:h}=e,_=_e(h),v=e.leftArrow||e.leftText||n.left,b=e.rightText||n.right;return d("div",{ref:r,style:_,class:[B({fixed:m}),{[Fe]:y,"van-safe-area-top":e.safeAreaInsetTop}]},[d("div",{class:B("content")},[v&&d("div",{class:[B("left",{disabled:e.leftDisabled}),e.clickable&&!e.leftDisabled?te:""],onClick:c},[s()]),d("div",{class:[B("title"),"van-ellipsis"]},[n.title?n.title():l]),b&&d("div",{class:[B("right",{disabled:e.rightDisabled}),e.clickable&&!e.rightDisabled?te:""],onClick:i},[u()])])])};return()=>e.fixed&&e.placeholder?a(o):o()}});const Nt=N(Et),[Ht,ee]=E("swipe-cell"),Mt={name:qe(""),disabled:Boolean,leftWidth:p,rightWidth:p,beforeClose:Function,stopPropagation:Boolean};var Vt=H({name:Ht,props:Mt,emits:["open","close","click"],setup(e,{emit:t,slots:n}){let r,a,c,i;const s=g(),u=g(),o=g(),l=Qe({offset:0,dragging:!1}),m=Te(),y=f=>f.value?We(f).width:0,h=C(()=>A(e.leftWidth)?+e.leftWidth:y(u)),_=C(()=>A(e.rightWidth)?+e.rightWidth:y(o)),v=f=>{l.offset=f==="left"?h.value:-_.value,r||(r=!0,t("open",{name:e.name,position:f}))},b=f=>{l.offset=0,r&&(r=!1,t("close",{name:e.name,position:f}))},w=f=>{const I=Math.abs(l.offset),D=.15,Oe=r?1-D:D,re=f==="left"?h.value:_.value;re&&I>re*Oe?v(f):b(f)},S=f=>{e.disabled||(c=l.offset,m.start(f))},$=f=>{if(e.disabled)return;const{deltaX:I}=m;m.move(f),m.isHorizontal()&&(a=!0,l.dragging=!0,(!r||I.value*c<0)&&ae(f,e.stopPropagation),l.offset=Ke(I.value+c,-_.value,h.value))},M=()=>{l.dragging&&(l.dragging=!1,w(l.offset>0?"left":"right"),setTimeout(()=>{a=!1},0))},j=(f="outside")=>{i||(t("click",f),r&&!a&&(i=!0,be(e.beforeClose,{args:[{name:e.name,position:f}],done:()=>{i=!1,b(f)},canceled:()=>i=!1,error:()=>i=!1})))},k=(f,I)=>D=>{I&&D.stopPropagation(),j(f)},P=(f,I)=>{const D=n[f];if(D)return d("div",{ref:I,class:ee(f),onClick:k(f,!0)},[D()])};return Q({open:v,close:b}),Ye(s,()=>j("outside"),{eventName:"touchstart"}),oe("touchmove",$,{target:s}),()=>{var f;const I={transform:`translate3d(${l.offset}px, 0, 0)`,transitionDuration:l.dragging?"0s":".6s"};return d("div",{ref:s,class:ee(),onClick:k("cell",a),onTouchstartPassive:S,onTouchend:M,onTouchcancel:M},[d("div",{class:ee("wrapper"),style:I},[P("left",u),(f=n.default)==null?void 0:f.call(n),P("right",o)])])}}});const jt=N(Vt),Ft={class:"my-[50px] px-[10px]"},Yt={__name:"stockAdd",emits:["finish"],setup(e,{expose:t,emit:n}){const r=n,a=g(!1),c=()=>a.value=!0,i=C(()=>[{name:"stockId",label:"股票代碼",type:"text",cssStyle:!0,rules:[{required:!0,message:"必填"}]},{name:"buyDate",label:"買入日期",type:"date",cssStyle:!0,rules:[{required:!0,message:"必填"}]},{name:"buyPrice",label:"買入價",type:"text",cssStyle:!0,rules:[{required:!0,message:"必填"}]},{name:"buyNum",label:"買入股數",type:"text",cssStyle:!0,rules:[{required:!0,message:"必填"}]}]),s=g({}),u=g(!1),o=()=>{u.value=!0,et(s.value).then(l=>{l.status===200&&(tt({message:"新增成功",type:"success",plain:!0}),a.value=!1,r("finish"))}).finally(()=>{u.value=!1})};return t({open:c}),(l,m)=>{const y=Be,h=kt;return O(),se(h,{show:Y(a),"onUpdate:show":m[0]||(m[0]=_=>Ce(a)?a.value=_:null),position:"right",style:{width:"100%",height:"100%"},closeable:""},{default:R(()=>[x("div",Ft,[d(y,{fields:Y(i),parentForm:Y(s),submitText:"新增",submitting:Y(u),onSubmitFn:o},null,8,["fields","parentForm","submitting"])])]),_:1},8,["show"])}}},qt={class:"py-[10px] text-[var(--text-secondary-color)]"},Wt={class:"flex justify-between"},Kt={class:"font-black text-[color:var(--text-main-color)] text-[18px]"},Xt=x("span",{class:"text-[14px]"},"$",-1),Ut={class:"font-black text-[color:var(--text-main-color)] text-[14px]"},Gt={class:"flex justify-between items-center"},Zt=x("div",{class:""},"購入日",-1),Jt={class:""},Qt={class:"flex justify-between items-center"},en=x("div",{class:""},"已領股利",-1),tn={class:"font-bold"},nn={class:"flex justify-between items-center"},an=x("div",{class:""},"未實現價差",-1),on={class:"font-bold"},ln={__name:"stockListCard",props:{item:{type:Object,required:!0},stockPrice:{type:Number,required:!0}},setup(e){const t=e,n=C(()=>t.item.buyPrice??0),r=C(()=>t.item.buyNum??0),a=C(()=>nt(t.item.buyDate).format("YYYY-MM-DD")??"-"),c=C(()=>{var o;return((o=t==null?void 0:t.item)==null?void 0:o.earnDividend)??null}),i=C(()=>c.value!==null?c.value:"尚未更新"),s=C(()=>{var o;return((o=t==null?void 0:t.item)==null?void 0:o.earnPrice)??null}),u=C(()=>at(c.value??0,s.value??0));return(o,l)=>(O(),z("div",qt,[x("div",Wt,[x("div",Kt,[Xt,we(" "+L(n.value),1)]),x("div",Ut,L(r.value)+"股",1)]),x("div",Gt,[Zt,x("div",Jt,L(a.value),1)]),x("div",Qt,[en,x("div",tn,L(i.value),1)]),x("div",nn,[an,x("div",on,L(s.value),1)]),x("div",{class:ot(["text-[24px] font-bold text-right",{"text-[var(--main-fall-color)]":s.value<0,"text-[var(--main-rise-color)]":s.value>0}])},L(u.value),3)]))}},sn={class:"mx-[-16px] mt-[-12px]"},cn={class:"bg-[var(--main-sub-color)] px-[16px] py-[10px] text-[white] font-black text-[18px] text-right flex justify-between items-center"},rn=x("span",{class:"text-[14px]"},"現價/收盤價",-1),un={class:"divide-y divide-[var(--main-sub-color)] px-[16px]"},dn={__name:"stockList",props:{data:{type:Object,default:()=>{}},stockId:{type:String,required:!0}},setup(e){const t=e,n=C(()=>{var a;return(a=t==null?void 0:t.data)==null?void 0:a.data}),r=C(()=>{var a;return((a=t==null?void 0:t.data)==null?void 0:a.price)??"未更新"});return(a,c)=>{const i=ln,s=jt;return O(),z("div",sn,[x("div",cn,[rn,we(" "+L(r.value),1)]),x("div",un,[(O(!0),z(K,null,Se(n.value,u=>(O(),se(s,{key:u.id},{default:R(()=>[d(i,{item:u,stockPrice:r.value},null,8,["item","stockPrice"])]),_:2},1024))),128))])])}}},fn={},vn={class:"w-full absolute top-0 z-10"},mn=x("div",{class:"mb-[46px]"},null,-1);function hn(e,t){const n=Nt;return O(),z(K,null,[x("div",vn,[d(n,{title:"庫存"},{right:R(()=>[lt(e.$slots,"default")]),_:3})]),mn],64)}const _n=Ie(fn,[["render",hn]]),bn={class:"min-h-[50px] cell-list"},gn={class:"flex justify-between"},xn={class:"font-black text-[18px]"},yn={class:"font-black text-[color:var(--text-main-color)] text-[14px]"},De={__name:"index",setup(e){const t=st(),n=C(()=>t==null?void 0:t.stockList),r=C(()=>t==null?void 0:t.loading),a=g("null"),c=g(null),i=()=>c.value&&c.value.open(),s=()=>t.getData();return(u,o)=>{const l=W,m=_n,y=dn,h=Rt,_=Dt,v=Yt,b=ct;return O(),z(K,null,[d(m,null,{default:R(()=>[d(l,{name:"plus",size:"28",onClick:i})]),_:1}),J((O(),z("div",bn,[d(_,{modelValue:Y(a),"onUpdate:modelValue":o[0]||(o[0]=w=>Ce(a)?a.value=w:null),accordion:""},{default:R(()=>[(O(!0),z(K,null,Se(n.value,(w,S)=>(O(),se(h,{name:S,key:S},{title:R(()=>[x("div",gn,[x("div",xn,L(S),1),x("div",yn,L(w.data.reduce(($,M)=>$+M.buyNum,0))+"股 ",1)])]),default:R(()=>[d(y,{data:w,stockId:S},null,8,["data","stockId"])]),_:2},1032,["name"]))),128))]),_:1},8,["modelValue"])])),[[b,r.value]]),d(v,{ref_key:"stockAddHook",ref:c,onFinish:s},null,512)],64)}}};typeof fe=="function"&&fe(De);const Sn=Ie(De,[["__scopeId","data-v-8cb071bc"]]);export{Sn as default};
