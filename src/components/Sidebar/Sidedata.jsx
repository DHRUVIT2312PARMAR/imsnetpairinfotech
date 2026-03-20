import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const Sidedata = ({ navpath, icon, data, coll }) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 200);
  };

  return (
    <NavLink
      to={navpath}
      onClick={handleClick}
      style={{ transform: clicked ? "scale(0.95)" : "scale(1)", transition: "transform 0.1s" }}
      className={({ isActive }) =>
        `flex items-center h-12 p-2 rounded transition-colors
        ${isActive
          ? "bg-gray-200 border-l-4 border-blue-600 text-blue-700 font-semibold"
          : "hover:bg-gray-100 text-gray-700"
        }
        ${coll ? "justify-center" : "gap-3"}`
      }
    >
      <div className="text-2xl flex-shrink-0">
        <i className={icon}></i>
      </div>
      {!coll && <p className="text-sm font-medium truncate">{data}</p>}
    </NavLink>
  );
};

export default Sidedata;
