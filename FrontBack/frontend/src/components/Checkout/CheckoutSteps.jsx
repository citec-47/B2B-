// Components/Checkout/CheckoutSteps.jsx
import React from 'react';
import styles from '../../styles/styles';

const CheckoutSteps = ({ active }) => {
    return (
        <div className='w-full flex justify-center'>
            <div className="w-[90%] 800px:w-[50%] flex items-center justify-between">
                {/* Step 1: Shipping */}
                <div className="flex items-center">
                    <div className={`${styles.cart_button} ${active >= 1 ? '!bg-[#f63b60]' : '!bg-[#FDE1E6]'}`}>
                        <span className={`${styles.cart_button_text} ${active >= 1 ? '!text-white' : '!text-[#f63b60]'}`}>
                            1.Shipping
                        </span>
                    </div>
                    <div className={`w-[30px] 800px:w-[70px] h-[4px] ${active >= 2 ? '!bg-[#f63b60]' : '!bg-[#FDE1E6]'}`} />
                </div>

                {/* Step 2: Payment */}
                <div className="flex items-center">
                    <div className={`${styles.cart_button} ${active >= 2 ? '!bg-[#f63b60]' : '!bg-[#FDE1E6]'}`}>
                        <span className={`${styles.cart_button_text} ${active >= 2 ? '!text-white' : '!text-[#f63b60]'}`}>
                            2.Payment
                        </span>
                    </div>
                    <div className={`w-[30px] 800px:w-[70px] h-[4px] ${active >= 3 ? '!bg-[#f63b60]' : '!bg-[#FDE1E6]'}`} />
                </div>

                {/* Step 3: Success */}
                <div className="flex items-center">
                    <div className={`${styles.cart_button} ${active >= 3 ? '!bg-[#f63b60]' : '!bg-[#FDE1E6]'}`}>
                        <span className={`${styles.cart_button_text} ${active >= 3 ? '!text-white' : '!text-[#f63b60]'}`}>
                            3.Success
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutSteps;