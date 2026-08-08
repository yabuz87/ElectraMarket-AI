import React from "react";
import { Bot, PackageCheck, ShoppingCart, Smartphone, Truck } from "lucide-react";

const About = () => {
  return (
    <div className="container my-5">
      <h2 className="text-center mb-4">About Us</h2>
      <p className="lead text-center">
        Your trusted smartphone destination — built for Ethiopia, by Ethiopians.
      </p>
      <div className="row mt-4">
        <div className="col-md-6">
         <img
            src="https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1000&q=80"
            alt="Three different cell phones sitting next to each other"
            className="img-fluid rounded shadow"
            />


        </div>
        <div className="col-md-6">
          <h4>Who We Are</h4>
          <p>
            We are a passionate team of tech enthusiasts dedicated to bringing the latest smartphones to every corner of Ethiopia. 
            Our mission is to deliver quality devices, unbeatable prices, and seamless online experiences tailored to our local market.
          </p>

          <h4>What Makes Us Different</h4>
          <ul className="list-unstyled d-grid gap-3">
            <li className="d-flex gap-2"><ShoppingCart aria-hidden="true" size={20} className="text-primary flex-shrink-0" /> 100% locally-focused e-commerce experience</li>
            <li className="d-flex gap-2"><Smartphone aria-hidden="true" size={20} className="text-primary flex-shrink-0" /> Wide selection of the latest and most trusted smartphone brands</li>
            <li className="d-flex gap-2"><Truck aria-hidden="true" size={20} className="text-primary flex-shrink-0" /> Reliable delivery and pickup across Ethiopia</li>
            <li className="d-flex gap-2"><Bot aria-hidden="true" size={20} className="text-primary flex-shrink-0" /> Local language customer support and smart assistant integration</li>
            <li className="d-flex gap-2"><PackageCheck aria-hidden="true" size={20} className="text-primary flex-shrink-0" /> Hassle-free returns and verified product guarantees</li>
          </ul>

          <h4>Our Vision</h4>
          <p>
            To become Ethiopia’s most customer-centric mobile tech platform —
            where anyone can browse, buy, and trust in the power of local e-commerce.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
