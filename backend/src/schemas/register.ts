import type { FastifyInstance } from 'fastify';
import { zodToOpenApiSchema } from './utils.js';
import { errorResponseSchema } from './error.schema.js';
import { characterSchema } from './character.schema.js';
import {
  characterSkillsStateSchema,
  upgradeSkillResponseSchema,
} from './character_skills.schema.js';
import {
  characterRosterSchema,
} from './character_roster.schema.js';
import {
  createGameBodySchema,
  deleteGameResponseSchema,
  gameListSchema,
  gameSchema,
  updateGameBodySchema,
} from './game.schema.js';
import { endTurnBodySchema, endTurnResponseSchema, nextTurnForecastResponseSchema } from './turn.schema.js';
import { gameNewsResponseSchema } from './news.schema.js';
import { gameDashboardResponseSchema } from './dashboard.schema.js';
import {
  buyStockBodySchema,
  buyStockResponseSchema,
  sellStockBodySchema,
  sellStockResponseSchema,
  ipoListResponseSchema,
  ipoSubscribeBodySchema,
  ipoSubscribeResponseSchema,
  portfolioResponseSchema,
  stockDetailResponseSchema,
  stockHistoryResponseSchema,
  stockListingSchema,
  stockListResponseSchema,
  marketSentimentSchema,
  sectorMomentumSchema,
} from './stock.schema.js';
import {
  acceptPropertyOfferResponseSchema,
  negotiatePropertyOfferBodySchema,
  negotiatePropertyOfferResponseSchema,
  propertyOfferPaymentModeSchema,
  acceptPropertyOfferBodySchema,
  propertyOfferSchema,
} from './property_offer.schema.js';
import { acceptOtcDealBodySchema, acceptOtcDealResponseSchema } from './otc_deal.schema.js';
import { payOffInstallmentBodySchema, payOffInstallmentResponseSchema } from './property_loan.schema.js';
import { updateUserBodySchema, userSchema } from './user.schema.js';
import { logoutResponseSchema, refreshTokenResponseSchema, authTokenResponseSchema, registerBodySchema, loginBodySchema } from './auth.schema.js';

const schemaEntries = {
  ErrorResponse: errorResponseSchema,
  Character: characterSchema,
  CharacterSkillsState: characterSkillsStateSchema,
  UpgradeSkillResponse: upgradeSkillResponseSchema,
  CharacterRoster: characterRosterSchema,
  Game: gameSchema,
  GameList: gameListSchema,
  CreateGameBody: createGameBodySchema,
  UpdateGameBody: updateGameBodySchema,
  DeleteGameResponse: deleteGameResponseSchema,
  EndTurnResponse: endTurnResponseSchema,
  EndTurnBody: endTurnBodySchema,
  GameNewsResponse: gameNewsResponseSchema,
  NextTurnForecastResponse: nextTurnForecastResponseSchema,
  GameDashboardResponse: gameDashboardResponseSchema,
  AcceptPropertyOfferResponse: acceptPropertyOfferResponseSchema,
  NegotiatePropertyOfferBody: negotiatePropertyOfferBodySchema,
  NegotiatePropertyOfferResponse: negotiatePropertyOfferResponseSchema,
  PropertyOfferPaymentMode: propertyOfferPaymentModeSchema,
  AcceptPropertyOfferBody: acceptPropertyOfferBodySchema,
  PropertyOffer: propertyOfferSchema,
  AcceptOtcDealBody: acceptOtcDealBodySchema,
  AcceptOtcDealResponse: acceptOtcDealResponseSchema,
  PayOffInstallmentResponse: payOffInstallmentResponseSchema,
  PayOffInstallmentBody: payOffInstallmentBodySchema,
  StockListing: stockListingSchema,
  StockListResponse: stockListResponseSchema,
  StockDetailResponse: stockDetailResponseSchema,
  StockHistoryResponse: stockHistoryResponseSchema,
  BuyStockBody: buyStockBodySchema,
  BuyStockResponse: buyStockResponseSchema,
  SellStockBody: sellStockBodySchema,
  SellStockResponse: sellStockResponseSchema,
  PortfolioResponse: portfolioResponseSchema,
  MarketSentiment: marketSentimentSchema,
  SectorMomentum: sectorMomentumSchema,
  IpoListResponse: ipoListResponseSchema,
  IpoSubscribeBody: ipoSubscribeBodySchema,
  IpoSubscribeResponse: ipoSubscribeResponseSchema,
  User: userSchema,
  UpdateUserBody: updateUserBodySchema,
  RefreshTokenResponse: refreshTokenResponseSchema,
  LogoutResponse: logoutResponseSchema,
  AuthTokenResponse: authTokenResponseSchema,
  RegisterBody: registerBodySchema,
  LoginBody: loginBodySchema,
} as const;

export const fastifyDefMap = Object.fromEntries(
  Object.keys(schemaEntries).map((id, index) => [`def-${index}`, id]),
);

export async function registerOpenApiSchemas(fastify: FastifyInstance) {
  for (const [id, schema] of Object.entries(schemaEntries)) {
    fastify.addSchema({
      $id: id,
      ...zodToOpenApiSchema(schema),
    });
  }
}

export const openApiComponentSchemas = Object.fromEntries(
  Object.entries(schemaEntries).map(([id, schema]) => [id, zodToOpenApiSchema(schema)]),
);

export const errorResponses = {
  400: { $ref: 'ErrorResponse#' },
  401: { $ref: 'ErrorResponse#' },
  404: { $ref: 'ErrorResponse#' },
  409: { $ref: 'ErrorResponse#' },
  500: { $ref: 'ErrorResponse#' },
} as const;
