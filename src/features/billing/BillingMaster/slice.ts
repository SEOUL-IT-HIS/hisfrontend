import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type BillingMaster, type BillingMasterCreateRequest, type BillingMasterState, type Status } from "./types";

const initialStatus:Status={ loading:false,error:null,success:false };

const initialState:BillingMasterState={
    list:[],detail:null,

    listStatus:{...initialStatus},
    detailStatus:{...initialStatus},
    createStatus:{...initialStatus}
};
const BillingMasterSlice=createSlice({
    name:"billingMaster",
    initialState,
    reducers:{
        // 전체조회
        fetchBillingMasterRequest:(state)=>{
            state.listStatus={...initialStatus,loading:true};
        },
        fetchBillingMasterSuccess:(state,action:PayloadAction<BillingMaster[]>)=>{
            state.listStatus={...initialStatus,loading:false};
            state.list=action.payload;
        },
        fetchBillingMasterFailure:(state,action:PayloadAction<string>)=>{
            state.listStatus={...initialStatus,loading:false,error:action.payload};
        },

        // 상세조회
        fetchBillingMasterDetailRequest:(state,_action:PayloadAction<string>)=>{
            state.detailStatus={...initialStatus,loading:true};
            state.detail = null;
        },
        fetchBillingMasterDetailSuccess:(state,action:PayloadAction<BillingMaster>)=>{
            state.detailStatus={...initialStatus,loading:false};
            state.detail=action.payload;
        },
        fetchBillingMasterDetailFailure:(state,action:PayloadAction<string>)=>{
            state.detailStatus={...initialStatus,loading:false,error:action.payload};
        },

        // 등록
        registerBillingMasterRequest:(state,_action:PayloadAction<BillingMasterCreateRequest>)=>{
            state.createStatus={...initialStatus,loading:true};
        },
        registerBillingMasterSuccess:(state)=>{
            state.createStatus={...initialStatus,loading:false,success:true};
        },
        registerBillingMasterFailure:(state,action:PayloadAction<string>)=>{
            state.createStatus={...initialStatus,loading:false,error:action.payload};
        },   
        

    }
});

export const {
    fetchBillingMasterRequest,
    fetchBillingMasterSuccess,
    fetchBillingMasterFailure,
    fetchBillingMasterDetailRequest,
    fetchBillingMasterDetailSuccess,
    fetchBillingMasterDetailFailure,
    registerBillingMasterRequest,
    registerBillingMasterSuccess,
    registerBillingMasterFailure
}=BillingMasterSlice.actions;
export default BillingMasterSlice.reducer;