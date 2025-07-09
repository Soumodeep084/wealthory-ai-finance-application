"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Fake city names (not real)
const cities = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
  "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
];

// One nearby place for each city
const nearbyPlaceOptions = [
  "XYZ Hotel", "ABC School", "LMN Café", "QRS Gym", "DEF Library"
];

// Generate fake address and one random nearby place for each city
const addresses = {};
const nearbyPlaces = {};

cities.forEach((city) => {
  const randomNumber = Math.floor(Math.random() * 900 + 100); // Between 100 and 999
  const zone = randomNumber < 500 ? "East" : "West";

  addresses[city] = `${randomNumber} ${city} Road, ${city} ${zone} , Pincode : XXXXXX`;
  
  const randomIndex = Math.floor(Math.random() * nearbyPlaceOptions.length);
  nearbyPlaces[city] = nearbyPlaceOptions[randomIndex];
});


export default function HelpCenter() {
  const [selectedCity, setSelectedCity] = useState(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Help Center</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Your City</DialogTitle>
        </DialogHeader>

        <Select onValueChange={setSelectedCity}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a city" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCity && (
          <div className="mt-4 text-sm text-gray-700">
            <p className="font-medium">📍 Support Address for {selectedCity}:</p>
            <p className="mb-2">{addresses[selectedCity]}</p>

            <p className="font-medium">🏢 Nearby Place:</p>
            <p>{nearbyPlaces[selectedCity]}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
