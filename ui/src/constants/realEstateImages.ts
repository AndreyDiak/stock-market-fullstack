import imgHarvester from '../assets/realEstates/harvester.png'
import imgPainting from '../assets/realEstates/painting.png'
import imgApartment from '../assets/realEstates/apartment.png'
import imgCar from '../assets/realEstates/car.png'
import imgCarWash from '../assets/realEstates/car_wash.png'
import imgCountryHouse from '../assets/realEstates/country_house.png'
import imgGarage from '../assets/realEstates/garage.png'
import imgOldGarage from '../assets/realEstates/old_garage.png'
import imgParkingSpot from '../assets/realEstates/parking_spot.png'
import imgPenthouse from '../assets/realEstates/penthouse.png'
import imgSportCar from '../assets/realEstates/sport_car.png'
import imgTractor from '../assets/realEstates/tractor.png'
import imgTradePavilion from '../assets/realEstates/trade_pavilion.png'
import imgTrip from '../assets/realEstates/trip.png'
import imgWarehouse from '../assets/realEstates/warehouse.png'
import imgYacht from '../assets/realEstates/yacht.png'
import imgBoat from '../assets/realEstates/boat.png'
import imgHikingTicket from '../assets/realEstates/hiking_ticket.png'
import imgCollectibleCard from '../assets/realEstates/collectible_card.png'

export const REAL_ESTATE_IMAGES: Record<string, string> = {
  old_garage: imgOldGarage,
  garage: imgGarage,
  parking_spot: imgParkingSpot,
  apartment: imgApartment,
  country_house: imgCountryHouse,
  penthouse: imgPenthouse,
  warehouse: imgWarehouse,
  trade_pavilion: imgTradePavilion,
  car_wash: imgCarWash,
  car: imgCar,
  sport_car: imgSportCar,
  yacht: imgYacht,
  tractor: imgTractor,
  combine_harvester: imgHarvester,
  trip: imgTrip,
  expensive_painting: imgPainting,
  boat: imgBoat,
  hiking_ticket: imgHikingTicket,
  collectible_card: imgCollectibleCard,
}

export function getRealEstateImage(itemRef: string): string | undefined {
  return REAL_ESTATE_IMAGES[itemRef]
}
