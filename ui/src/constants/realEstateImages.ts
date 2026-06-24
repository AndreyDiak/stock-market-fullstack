import imgApartment from '../assets/realEstates/apartment.png'
import imgCar from '../assets/realEstates/car.png'
import imgCountryHouse from '../assets/realEstates/country_house.png'
import imgGarage from '../assets/realEstates/garage.png'
import imgOldGarage from '../assets/realEstates/old_garage.png'
import imgParkingSpot from '../assets/realEstates/parking_spot.png'
import imgPenthouse from '../assets/realEstates/penthouse.png'
import imgSportCar from '../assets/realEstates/sport_car.png'
import imgTractor from '../assets/realEstates/tractor.png'
import imgTrip from '../assets/realEstates/trip.png'
import imgWarehouse from '../assets/realEstates/warehouse.png'
import imgYacht from '../assets/realEstates/yacht.png'

export const REAL_ESTATE_IMAGES: Record<string, string> = {
  old_garage: imgOldGarage,
  garage: imgGarage,
  parking_spot: imgParkingSpot,
  apartment: imgApartment,
  country_house: imgCountryHouse,
  penthouse: imgPenthouse,
  warehouse: imgWarehouse,
  car: imgCar,
  sport_car: imgSportCar,
  yacht: imgYacht,
  tractor: imgTractor,
  trip: imgTrip,
}

export function getRealEstateImage(itemRef: string): string | undefined {
  return REAL_ESTATE_IMAGES[itemRef]
}
