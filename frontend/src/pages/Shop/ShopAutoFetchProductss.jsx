// src/pages/Shop/ShopAutoFetchProductss.jsx
import React from "react";
import DashboardSideBar from "../../components/Shop/Layout/DashboardSideBar";
import DashboardHeader from "../../components/Shop/Layout/DashboardHeader";
import AutoFetchProducts from "../../components/Shop/AutoFetchProducts";

const ShopAutoFetchProducts = () => {
    return (
        <div>
            <DashboardHeader />
            <div className="flex min-h-screen bg-[#F5F5F5]">
                <div className="800px:w-[330px] w-0">
                    <DashboardSideBar active={12} />
                </div>
                <div className="flex-1 overflow-y-auto">
                    <AutoFetchProducts />
                </div>
            </div>
        </div>
    );
};

export default ShopAutoFetchProducts;