import React, { useEffect } from 'react'
import ShopLogin from "../components/Shop/ShopLogin";
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ShopLoginPage = () => {
    const navigate = useNavigate();
    const { isSeller, isLoading } = useSelector((state) => state.seller);
    // if user is login then redirect to home page
    useEffect(() => {
        if (isSeller === true) {
            navigate(`/dashboard`);
        }
<<<<<<< HEAD
    }, [isLoading, isSeller, navigate]); // Added navigate to dependency array
=======
    }, [isLoading, isSeller])
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    return (
        <div>
            <ShopLogin />
        </div>
    )
}

<<<<<<< HEAD
export default ShopLoginPage;
=======
export default ShopLoginPage
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
