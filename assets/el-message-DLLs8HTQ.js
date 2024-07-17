import{a4 as q,_ as H,r as k,a as w,k as N,o as l,b as m,c as F,L as h,a5 as I,z as n,w as y,M as V,B as R,f,K as C,a6 as p,F as x,P as M,e as j,a7 as z,a8 as L,a9 as G,aa as K,ab as Z,ac as J,ad as Q,ae as W,H as X,af as Y}from"./index-Ds7PqTxV.js";const ee=(v,b,s="msg",o="确认",r="取消")=>new Promise((c,t)=>{q.confirm(v,b,{confirmButtonText:o,cancelButtonText:r,center:!0,customClass:s}).then(()=>c(!0)).catch(()=>t(!1))}),ae={class:"el-date-picker"},le={__name:"TwoElDatePicker",props:{modelValue:{type:String,default:null},placeholder:{type:String,default:""},readonly:{type:Boolean,default:!1},disabled:{type:Boolean,default:!1}},emits:["update:modelValue"],setup(v,{emit:b}){const s=v,o=b,r=k(""),c=()=>{o("update:modelValue",t.value)},t=w(()=>{const u=new Date(r.value),i=8*60;return u.setMinutes(u.getMinutes()+i),u.toISOString().split("T")[0]});return N(()=>s.modelValue,u=>{u&&(r.value=new Date(s.modelValue))},{immediate:!0}),(u,i)=>{const B=I;return l(),m("div",ae,[F(B,{modelValue:r.value,"onUpdate:modelValue":i[0]||(i[0]=E=>r.value=E),class:h([s.readonly?"is-readonly":""]),type:"date",placeholder:s.placeholder,onChange:c,readonly:s.readonly,disabled:s.disabled},null,8,["modelValue","class","placeholder","readonly","disabled"])])}}},te=H(le,[["__scopeId","data-v-82260aab"]]),oe={class:"show-unit"},se={class:"col-span-12"},ne={key:0,class:"submit col-span-12 flex pb-[20px]"},ue={__name:"TwoDynamicForm",props:{fields:{type:Array,required:!0},parentForm:{type:Object,required:!0},rules:{type:Object,default:()=>{}},submitHide:{type:Boolean,default:!1},submitting:{type:Boolean,default:!1},submitAlert:{type:String,required:!1},submitText:{type:String,default:""},isHideAsterisk:{type:Boolean,default:!0}},emits:["submitFn"],setup(v,{expose:b,emit:s}){const o=v,r=s,c=k(null),t=w(()=>o.parentForm),u=k(0);k(!1),w(()=>u.value?u.value:"取得驗證碼");const i=d=>{d&&d.validate(_=>{if(_)o.submitAlert?ee(o.submitAlert,()=>r("submitFn")):r("submitFn");else return!1})};return b({resetFormMethod:()=>{c.value.resetFields()},validateFormMethod:()=>new Promise((d,_)=>{c.value.validate(g=>{g?d():_()})})}),(d,_)=>{const g=L,U=G,S=K,T=Z,D=J,O=Q,A=W,P=X,$=Y;return l(),n($,{ref_key:"ruleFormRef",ref:c,model:t.value,rules:o.rules,onSubmit:z(i,["prevent"]),class:"setting-base-form-use grid grid-cols-12","hide-required-asterisk":o.isHideAsterisk},{default:y(()=>[(l(!0),m(x,null,V(o.fields,e=>(l(),m("div",{key:e.name,class:h(["max-xl:!col-span-12",[e.col?`col-span-${e.col}`:"col-span-12"]])},[F(A,{label:e.label,prop:e.name,rules:e.rules,class:"setting-form-item flex flex-col items-start"},{default:y(()=>[e.type==="text"||e.type==="password"||e.type==="number"||e.type==="textarea"?(l(),n(g,{key:0,modelValue:t.value[e.name],"onUpdate:modelValue":a=>t.value[e.name]=a,type:e.type,placeholder:e.placeholder?e.placeholder:"","show-password":e.type==="password",class:h([[e.readonly?"is-readonly":""],"h-[48px] flex-1"]),readonly:e.readonly},R({_:2},[e.unit?{name:"append",fn:y(()=>[f("div",oe,C(e.unit),1)]),key:"0"}:void 0]),1032,["modelValue","onUpdate:modelValue","type","placeholder","show-password","class","readonly"])):p("",!0),e.type==="select"&&!e.multiple?(l(),n(S,{key:1,modelValue:t.value[e.name],"onUpdate:modelValue":a=>t.value[e.name]=a,class:"flex-1",placeholder:e.placeholder?e.placeholder:""},{default:y(()=>[(l(!0),m(x,null,V(e.selectOption,a=>(l(),n(U,{label:a.label,value:a.value,key:a.value},null,8,["label","value"]))),128))]),_:2},1032,["modelValue","onUpdate:modelValue","placeholder"])):p("",!0),e.type==="select"&&e.multiple?(l(),n(S,{key:2,modelValue:t.value[e.name],"onUpdate:modelValue":a=>t.value[e.name]=a,multiple:"","collapse-tags":!e.readonly,"collapse-tags-tooltip":!e.readonly,disabled:e.readonly,class:"flex-1",placeholder:e.placeholder?e.placeholder:""},{default:y(()=>[(l(!0),m(x,null,V(e.selectOption,a=>(l(),n(U,{label:a.label,value:a.value,key:a.value},null,8,["label","value"]))),128))]),_:2},1032,["modelValue","onUpdate:modelValue","collapse-tags","collapse-tags-tooltip","disabled","placeholder"])):p("",!0),e.type==="radio"?(l(),n(D,{key:3,modelValue:t.value[e.name],"onUpdate:modelValue":a=>t.value[e.name]=a,disabled:e.readonly,class:"flex-1"},{default:y(()=>[(l(!0),m(x,null,V(e.selectOption,a=>(l(),n(T,{label:a.label,value:a.value,key:a.value},null,8,["label","value"]))),128))]),_:2},1032,["modelValue","onUpdate:modelValue","disabled"])):p("",!0),e.type==="switch"?(l(),n(O,{key:4,modelValue:t.value[e.name],"onUpdate:modelValue":a=>t.value[e.name]=a,disabled:e.readonly,class:"flex-1","inline-prompt":"","active-icon":d.Check,"inactive-icon":d.Close},null,8,["modelValue","onUpdate:modelValue","disabled","active-icon","inactive-icon"])):p("",!0),e.type==="date"?(l(),n(te,{key:5,modelValue:t.value[e.name],"onUpdate:modelValue":a=>t.value[e.name]=a,type:"date",class:"flex-1",placeholder:e.placeholder?e.placeholder:"",readonly:e.readonly},null,8,["modelValue","onUpdate:modelValue","placeholder","readonly"])):p("",!0),e.slot?(l(),m("div",{key:6,class:h(["flex-1",[e.slotClassName]])},[M(d.$slots,e.slot)],2)):p("",!0)]),_:2},1032,["label","prop","rules"])],2))),128)),f("div",se,[M(d.$slots,"bottom")]),o.submitHide?p("",!0):(l(),m("div",ne,[F(P,{onClick:_[0]||(_[0]=e=>i(c.value)),class:h(["ml-auto mr-auto !h-[48px] w-auto !rounded-[7px] text-[16px]",o.submitText?"btn-submit":""]),loading:o.submitting},{default:y(()=>[j(C(o.submitText||"送出"),1)]),_:1},8,["class","loading"])]))]),_:3},8,["model","rules","hide-required-asterisk"])}}};export{ue as _};
