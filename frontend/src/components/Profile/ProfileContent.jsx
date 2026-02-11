import React, { useEffect, useState } from 'react'
import { backend_url, server } from "../../server";
import { useDispatch, useSelector } from 'react-redux';
import {
    deleteUserAddress,
    loadUser,
    updatUserAddress,
    updateUserInformation,
} from "../../redux/actions/user";
import { AiOutlineArrowRight, AiOutlineCamera, AiOutlineDelete } from 'react-icons/ai';
import { Link } from 'react-router-dom';
import styles from "../../styles/styles";
import { DataGrid } from "@material-ui/data-grid";
import { Button } from "@material-ui/core";
import { RxCross1 } from 'react-icons/rx'
import { MdTrackChanges } from "react-icons/md";
import { toast } from "react-toastify";
import axios from 'axios';
import { Country, State } from "country-state-city";
import { getAllOrdersOfUser } from '../../redux/actions/order';

const ProfileContent = ({ active }) => {
    const { user, error, successMessage } = useSelector((state) => state.user);
    const [name, setName] = useState(user && user.name);
    const [email, setEmail] = useState(user && user.email);
    const [phoneNumber, setPhoneNumber] = useState(user && user.phoneNumber);
    const [password, setPassword] = useState("");
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const dispatch = useDispatch();

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch({ type: "clearErrors" });
        }
        if (successMessage) {
            toast.success(successMessage);
            dispatch({ type: "clearMessages" });
        }
    }, [error, successMessage]);

    // Function to get correct image URL
    const getImageUrl = (image) => {
        if (!image) {
            return "https://via.placeholder.com/150x150?text=No+Image";
        }
        
        if (typeof image === 'string') {
            // If it's already a full URL, return it
            if (image.startsWith("http")) return image;
            
            // If it's just a filename without path
            if (!image.includes('/')) {
                return `${backend_url}/uploads/${image}`;
            }
            
            // If it already includes uploads path
            if (image.includes('uploads/')) {
                return `${backend_url}/${image}`;
            }
            
            // Default: construct the URL
            return `${backend_url}/uploads/${image}`;
        }
        
        return "https://via.placeholder.com/150x150?text=Image+Error";
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !email) {
            toast.error("Name and email are required!");
            return;
        }
        dispatch(updateUserInformation(name, email, phoneNumber, password));
        setPassword(""); // Clear password field after submission
    }

    // Image update handler - FIXED VERSION
    const handleImage = async (e) => {
        const file = e.target.files[0];
        
        if (!file) {
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast.error("Please select a valid image file (JPEG, PNG, GIF, WebP)");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);
        
        setAvatar(file);
        setLoading(true);

        const formData = new FormData();
        formData.append("file", file); // Changed from "image" to "file" to match backend
        formData.append("userId", user._id); // Add user ID if needed by backend

        try {
            console.log("📤 Uploading image to:", `${server}/user/update-avatar`);
            
            const response = await axios.put(
                `${server}/user/update-avatar`, 
                formData, 
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    withCredentials: true,
                }
            );

            console.log("✅ Image upload response:", response.data);
            
            if (response.data.success) {
                toast.success("Profile picture updated successfully!");
                dispatch(loadUser()); // Reload user data
                // Clear the preview after successful upload
                setAvatarPreview(null);
                setAvatar(null);
            } else {
                toast.error(response.data.message || "Failed to update profile picture");
            }
        } catch (error) {
            console.error("❌ Image upload error:", error);
            console.error("Error details:", error.response?.data);
            toast.error(error.response?.data?.message || "Failed to upload image. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Alternative: Update avatar using user/update-user-info endpoint
    const handleImageUpdateAlternative = async (file) => {
        const formData = new FormData();
        formData.append("avatar", file); // Try "avatar" field name
        formData.append("name", user.name);
        formData.append("email", user.email);

        try {
            const response = await axios.put(
                `${server}/user/update-user-info`, 
                formData, 
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    withCredentials: true,
                }
            );

            if (response.data.success) {
                toast.success("Profile updated successfully!");
                dispatch(loadUser());
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Failed to update profile picture");
        }
    };

    return (
        <div className='w-full'>
            {/* Profile */}
            {
                active === 1 && (
                    <>
                        <div className="flex justify-center w-full">
                            <div className='relative'>
                                <img 
                                    src={avatarPreview || getImageUrl(user?.avatar)}
                                    className="w-[150px] h-[150px] rounded-full object-cover border-[3px] border-[#3ad132]"
                                    alt="Profile" 
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://via.placeholder.com/150x150?text=User";
                                    }}
                                />

                                <div className="w-[40px] h-[40px] bg-[#3ad132] rounded-full flex items-center justify-center cursor-pointer absolute bottom-[5px] right-[5px] shadow-lg hover:bg-[#2ac121] transition-all">
                                    <input 
                                        type="file"
                                        id="image"
                                        className="hidden"
                                        onChange={handleImage}
                                        accept="image/*"
                                        disabled={loading}
                                    />
                                    <label htmlFor="image" className="cursor-pointer flex items-center justify-center w-full h-full">
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <AiOutlineCamera size={20} className="text-white" />
                                        )}
                                    </label>
                                </div>
                                
                                {/* Image upload status */}
                                {loading && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                        <div className="text-white text-sm">Uploading...</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Instructions */}
                        <div className="text-center mt-4 text-sm text-gray-600">
                            <p>Click the camera icon to upload a new profile picture</p>
                            <p className="text-xs mt-1">Supported formats: JPG, PNG, GIF, WebP (Max 5MB)</p>
                        </div>
                        
                        <br />

                        <div className='w-full px-5'>
                            <form onSubmit={handleSubmit} aria-required={true}>
                                <div className='w-full 800px:flex block pb-3'>

                                    <div className=' w-[100%] 800px:w-[50%]'>
                                        <label className='block pb-2'>Full Name *</label>
                                        <input 
                                            type="text"
                                            className={`${styles.input} !w-[95%] mb-4 800px:mb-0`}
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>

                                    <div className=' w-[100%] 800px:w-[50%]'>
                                        <label className='block pb-2'>Email Address *</label>
                                        <input 
                                            type="email"
                                            className={`${styles.input} !w-[95%] mb-4 800px:mb-0`}
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="w-full 800px:flex block pb-3">
                                    <div className=" w-[100%] 800px:w-[50%]">
                                        <label className="block pb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            className={`${styles.input} !w-[95%] mb-4 800px:mb-0`}
                                            value={phoneNumber || ""}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="Enter phone number"
                                        />
                                    </div>

                                    <div className=" w-[100%] 800px:w-[50%]">
                                        <label className="block pb-2">New Password (leave blank to keep current)</label>
                                        <input
                                            type="password"
                                            className={`${styles.input} !w-[95%] mb-4 800px:mb-0`}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter new password"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className={`w-[250px] h-[40px] border border-[#3a24db] text-center text-[#3a24db] rounded-[3px] mt-8 cursor-pointer hover:bg-[#3a24db] hover:text-white transition-all flex items-center justify-center mx-auto`}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-[#3a24db] border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Updating...
                                        </>
                                    ) : (
                                        "Update Profile"
                                    )}
                                </button>
                            </form>
                        </div>
                    </>
                )
            }

            {/* Order */}
            {active === 2 && <AllOrders />}

            {/* Refund order */}
            {active === 3 && <AllRefundOrders />}

            {/* Track order */}
            {active === 5 && <TrackOrder />}

            {/* Change Password */}
            {active === 6 && <ChangePassword />}

            {/* User Address */}
            {active === 7 && <Address />}
        </div>
    )
}

// All orders
const AllOrders = () => {
    const { user } = useSelector((state) => state.user);
    const { orders } = useSelector((state) => state.order);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getAllOrdersOfUser(user._id));
    }, [dispatch, user._id]);

    const columns = [
        { field: "id", headerName: "Order ID", minWidth: 150, flex: 0.7 },

        {
            field: "status",
            headerName: "Status",
            minWidth: 130,
            flex: 0.7,
            cellClassName: (params) => {
                return params.getValue(params.id, "status") === "Delivered"
                    ? "text-green-600"
                    : "text-yellow-600";
            },
        },
        {
            field: "itemsQty",
            headerName: "Items Qty",
            type: "number",
            minWidth: 130,
            flex: 0.7,
        },

        {
            field: "total",
            headerName: "Total",
            type: "number",
            minWidth: 130,
            flex: 0.8,
        },

        {
            field: " ",
            flex: 1,
            minWidth: 150,
            headerName: "",
            type: "number",
            sortable: false,
            renderCell: (params) => {
                return (
                    <Link to={`/user/order/${params.id}`}>
                        <Button>
                            <AiOutlineArrowRight size={20} />
                        </Button>
                    </Link>
                );
            },
        },
    ];

    const row = [];

    orders &&
        orders.forEach((item) => {
            row.push({
                id: item._id,
                itemsQty: item.cart?.length || 0,
                total: "US$ " + (item.totalPrice || 0),
                status: item.status || "Processing",
            });
        });

    return (
        <>
            <div className='pl-8 pt-1'>
                {orders && orders.length > 0 ? (
                    <DataGrid
                        rows={row}
                        columns={columns}
                        pageSize={10}
                        disableSelectionOnClick
                        autoHeight
                    />
                ) : (
                    <div className="text-center py-10">
                        <p className="text-gray-500 text-lg">No orders found</p>
                        <Link to="/">
                            <Button variant="contained" color="primary" className="mt-4">
                                Start Shopping
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}

// Refund page
const AllRefundOrders = () => {
    const { user } = useSelector((state) => state.user);
    const { orders } = useSelector((state) => state.order);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getAllOrdersOfUser(user._id));
    }, [dispatch, user._id]);

    const eligibleOrders = orders && orders.filter((item) => 
        item.status === "Processing refund" || 
        item.status === "Refund Success" || 
        item.status === "Refund Requested"
    );

    const columns = [
        { field: "id", headerName: "Order ID", minWidth: 150, flex: 0.7 },

        {
            field: "status",
            headerName: "Status",
            minWidth: 130,
            flex: 0.7,
            cellClassName: (params) => {
                return params.getValue(params.id, "status") === "Refund Success"
                    ? "text-green-600"
                    : "text-yellow-600";
            },
        },
        {
            field: "itemsQty",
            headerName: "Items Qty",
            type: "number",
            minWidth: 130,
            flex: 0.7,
        },

        {
            field: "total",
            headerName: "Total",
            type: "number",
            minWidth: 130,
            flex: 0.8,
        },

        {
            field: " ",
            flex: 1,
            minWidth: 150,
            headerName: "",
            type: "number",
            sortable: false,
            renderCell: (params) => {
                return (
                    <Link to={`/user/order/${params.id}`}>
                        <Button>
                            <AiOutlineArrowRight size={20} />
                        </Button>
                    </Link>
                );
            },
        },
    ];

    const row = [];

    eligibleOrders &&
        eligibleOrders.forEach((item) => {
            row.push({
                id: item._id,
                itemsQty: item.cart?.length || 0,
                total: "US$ " + (item.totalPrice || 0),
                status: item.status || "Processing",
            });
        });

    return (
        <div className="pl-8 pt-1">
            {eligibleOrders && eligibleOrders.length > 0 ? (
                <DataGrid
                    rows={row}
                    columns={columns}
                    pageSize={10}
                    autoHeight
                    disableSelectionOnClick
                />
            ) : (
                <div className="text-center py-10">
                    <p className="text-gray-500 text-lg">No refund orders found</p>
                </div>
            )}
        </div>
    );
};

// Track order
const TrackOrder = () => {
    const { user } = useSelector((state) => state.user);
    const { orders } = useSelector((state) => state.order);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getAllOrdersOfUser(user._id));
    }, [dispatch, user._id]);

    const columns = [
        { field: "id", headerName: "Order ID", minWidth: 150, flex: 0.7 },

        {
            field: "status",
            headerName: "Status",
            minWidth: 150,
            flex: 0.7,
            cellClassName: (params) => {
                return params.getValue(params.id, "status") === "Delivered"
                    ? "text-green-600"
                    : "text-yellow-600";
            },
        },
        {
            field: "itemsQty",
            headerName: "Items Qty",
            type: "number",
            minWidth: 130,
            flex: 0.7,
        },

        {
            field: "total",
            headerName: "Total",
            type: "number",
            minWidth: 130,
            flex: 0.8,
        },

        {
            field: " ",
            flex: 1,
            minWidth: 150,
            headerName: "",
            type: "number",
            sortable: false,
            renderCell: (params) => {
                return (
                    <Link to={`/user/track/order/${params.id}`}>
                        <Button>
                            <MdTrackChanges size={20} />
                        </Button>
                    </Link>
                );
            },
        },
    ];

    const row = []

    orders &&
        orders.forEach((item) => {
            row.push({
                id: item._id,
                itemsQty: item.cart?.length || 0,
                total: "US$ " + (item.totalPrice || 0),
                status: item.status || "Processing",
            });
        });

    return (
        <div className="pl-8 pt-1">
            {orders && orders.length > 0 ? (
                <DataGrid
                    rows={row}
                    columns={columns}
                    pageSize={10}
                    disableSelectionOnClick
                    autoHeight
                />
            ) : (
                <div className="text-center py-10">
                    <p className="text-gray-500 text-lg">No orders to track</p>
                    <Link to="/">
                        <Button variant="contained" color="primary" className="mt-4">
                            Start Shopping
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    )
}

// Change Password
const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const passwordChangeHandler = async (e) => {
        e.preventDefault();

        if (!oldPassword || !newPassword || !confirmPassword) {
            toast.error("All fields are required!");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("New password and confirm password don't match!");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long!");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.put(
                `${server}/user/update-user-password`,
                { oldPassword, newPassword, confirmPassword },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success("Password updated successfully!");
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='w-full px-5'>
            <h1 className='text-[25px] text-center font-[600] text[#000000ba] pb-2'>
                Change Password
            </h1>
            <div className='w-full'>
                <form
                    aria-required
                    onSubmit={passwordChangeHandler}
                    className="flex flex-col items-center"
                >
                    <div className=" w-[100%] 800px:w-[50%] mt-5">
                        <label className='block pb-2'>Current Password *</label>
                        <input 
                            type="password"
                            className={`${styles.input} !w-[95%] mb-4 800px:mb-0`}
                            required
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className=" w-[100%] 800px:w-[50%] mt-2">
                        <label className='block pb-2'>New Password *</label>
                        <input 
                            type="password"
                            className={`${styles.input} !w-[95%] mb-4 800px:mb-0`}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className=" w-[100%] 800px:w-[50%] mt-2">
                        <label className="block pb-2">Confirm New Password *</label>
                        <input
                            type="password"
                            className={`${styles.input} !w-[95%] mb-4 800px:mb-0`}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className={`w-[95%] h-[40px] border border-[#3a24db] text-center text-[#3a24db] rounded-[3px] mt-8 cursor-pointer hover:bg-[#3a24db] hover:text-white transition-all flex items-center justify-center`}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-[#3a24db] border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Updating...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Address
const Address = () => {
    const [open, setOpen] = useState(false);
    const [country, setCountry] = useState("");
    const [city, setCity] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [address1, setAddress1] = useState("");
    const [address2, setAddress2] = useState("");
    const [addressType, setAddressType] = useState("");
    const { user } = useSelector((state) => state.user);
    const dispatch = useDispatch();

    const addressTypeData = [
        { name: "Default" },
        { name: "Home" },
        { name: "Office" },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (addressType === "" || country === "" || city === "" || address1 === "") {
            toast.error("Please fill all the required fields!");
            return;
        }

        dispatch(
            updatUserAddress(
                country,
                city,
                address1,
                address2,
                zipCode,
                addressType
            )
        );
        
        setOpen(false);
        setCountry("");
        setCity("");
        setAddress1("");
        setAddress2("");
        setZipCode("");
        setAddressType("");
    }

    const handleDelete = (item) => {
        if (window.confirm("Are you sure you want to delete this address?")) {
            const id = item._id;
            dispatch(deleteUserAddress(id));
        }
    }

    return (
        <div className='w-full px-5'>
            {/* Add Address Modal */}
            {open && (
                <div className="fixed w-full h-screen bg-[#0000004b] top-0 left-0 flex items-center justify-center z-50">
                    <div className="w-[90%] 800px:w-[35%] h-[80vh] bg-white rounded shadow relative overflow-y-scroll">
                        <div className="w-full flex justify-end p-3">
                            <RxCross1
                                size={30}
                                className="cursor-pointer hover:text-red-500"
                                onClick={() => setOpen(false)}
                            />
                        </div>
                        <h1 className="text-center text-[25px] font-Poppins font-[600]">
                            Add New Address
                        </h1>
                        <div className='w-full p-4'>
                            <form aria-required onSubmit={handleSubmit} className="w-full">
                                <div className="w-full pb-2">
                                    <label className="block pb-2">Country *</label>
                                    <select
                                        name="country"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="w-full border h-[40px] rounded-[5px] px-2"
                                        required
                                    >
                                        <option value="">Choose your country</option>
                                        {Country &&
                                            Country.getAllCountries().map((item) => (
                                                <option
                                                    key={item.isoCode}
                                                    value={item.isoCode}
                                                >
                                                    {item.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* City */}
                                <div className="w-full pb-2">
                                    <label className="block pb-2">City *</label>
                                    <select
                                        name="city"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full border h-[40px] rounded-[5px] px-2"
                                        required
                                        disabled={!country}
                                    >
                                        <option value="">Choose your city</option>
                                        {State &&
                                            State.getStatesOfCountry(country).map((item) => (
                                                <option
                                                    key={item.isoCode}
                                                    value={item.isoCode}
                                                >
                                                    {item.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* Address 1 */}
                                <div className="w-full pb-2">
                                    <label className="block pb-2">Address 1 *</label>
                                    <input
                                        type="text"
                                        className={`${styles.input}`}
                                        required
                                        value={address1}
                                        onChange={(e) => setAddress1(e.target.value)}
                                        placeholder="Street address, P.O. Box, etc."
                                    />
                                </div>
                                
                                {/* Address 2 */}
                                <div className="w-full pb-2">
                                    <label className="block pb-2">Address 2 (Optional)</label>
                                    <input
                                        type="text"
                                        className={`${styles.input}`}
                                        value={address2}
                                        onChange={(e) => setAddress2(e.target.value)}
                                        placeholder="Apartment, suite, unit, etc."
                                    />
                                </div>

                                <div className="w-full pb-2">
                                    <label className="block pb-2">Zip/Postal Code</label>
                                    <input
                                        type="text"
                                        className={`${styles.input}`}
                                        value={zipCode}
                                        onChange={(e) => setZipCode(e.target.value)}
                                        placeholder="12345"
                                    />
                                </div>

                                <div className="w-full pb-2">
                                    <label className='block pb-2'>Address Type *</label>
                                    <select 
                                        name="addressType"
                                        value={addressType}
                                        onChange={(e) => setAddressType(e.target.value)}
                                        className='w-full border h-[40px] rounded-[5px] px-2'
                                        required
                                    >
                                        <option value="">Choose Address Type</option>
                                        {addressTypeData &&
                                            addressTypeData.map((item) => (
                                                <option
                                                    key={item.name}
                                                    value={item.name}
                                                >
                                                    {item.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="w-full pb-2">
                                    <button
                                        type="submit"
                                        className={`${styles.input} mt-5 cursor-pointer bg-[#3a24db] text-white hover:bg-[#2a1bcb] transition-all`}
                                    >
                                        Add Address
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <div className='flex w-full items-center justify-between' >
                <h1 className='text-[25px] font-[600] text[#000000ba] pb-2'>
                    My Addresses
                </h1>
                <div 
                    className={`${styles.button} rounded-md cursor-pointer`}
                    onClick={() => setOpen(true)}
                >
                    <span className='text-[#fff]'>Add New</span>
                </div>
            </div>
            <br />

            {user && user.addresses && user.addresses.length > 0 ? (
                user.addresses.map((item, index) => (
                    <div
                        className="w-full bg-white h-min 800px:h-[70px] rounded-[4px] flex items-center px-3 shadow justify-between pr-10 mb-5 hover:shadow-md transition-shadow"
                        key={index}
                    >
                        <div className="flex items-center">
                            <h5 className="pl-5 font-[600]">{item.addressType}</h5>
                        </div>
                        <div className="pl-8 flex items-center">
                            <h6 className="text-[12px] 800px:text-[14px]">
                                {item.address1} {item.address2 && `, ${item.address2}`}
                            </h6>
                        </div>
                        <div className="pl-8 flex items-center">
                            <h6 className="text-[12px] 800px:text-[14px]">
                                {item.city}, {item.country}
                            </h6>
                        </div>
                        <div className="min-w-[10%] flex items-center justify-between pl-8">
                            <AiOutlineDelete
                                size={25}
                                className="cursor-pointer hover:text-red-500 transition-colors"
                                onClick={() => handleDelete(item)}
                                title="Delete address"
                            />
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-8">
                    <h5 className="text-[18px] text-gray-500">
                        You don't have any saved addresses!
                    </h5>
                    <p className="text-gray-400 mt-2">
                        Add an address to make checkout easier.
                    </p>
                </div>
            )}
        </div>
    )
}

export default ProfileContent