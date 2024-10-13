import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { corsMiddleware } from "@/lib/utils/cors";

interface PostBody {
  package_id?: string;
}

type Data = {
  message: string;
  source_code?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await corsMiddleware(req, res);

  if (req.method === "POST") {
    let { package_id }: PostBody = req.body;

    let data = `module interview_example::main {
    use sui::object::{Self, UID, ID};
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use std::vector;
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::bag::{Self, Bag};
    use sui::clock::{Self, Clock};

    const EAuthencationError: u64 = 1;

    struct Leaderboard<phantom T> has key, store {
        id: UID,
        creator: address,
        reward: Balance<T>,
        claimed_reward_amount: u64,
        max_leaderboard_size: u64,
        top_projects: vector<ID>,
        top_balances: vector<u64>,
        end_timestamp_ms: u64,
    }

    struct ProjectManager has key, store {
        id: UID,
        projects: Bag,
    }

    struct Project<phantom T> has key, store {
        id: UID,
        leaderboard_id: ID,
        balance: Balance<T>
    }

    struct ProjectOwnerCap<phantom T> has key, store {
        id: UID,
        project_id: ID,
    }

    fun init(ctx: &mut TxContext) {
        let project_manager = ProjectManager {
            id: object::new(ctx),
            projects: bag::new(ctx),
        };
        transfer::share_object(project_manager);
    }

    public fun check_out_project<T>(
        project_manager: &mut ProjectManager,
        leaderboard: &Leaderboard<T>,
        project_id: ID,
        ctx: &mut TxContext
    ) {
        let project = bag::borrow_mut<ID, Project<T>>(&mut project_manager.projects, project_id);
        let project_balance_value = balance::value(&project.balance);
        let withdrawed_balance = balance::split(&mut project.balance, project_balance_value);
        let withdrawed_coin = coin::from_balance(withdrawed_balance, ctx);
        transfer::public_transfer(withdrawed_coin, leaderboard.creator);
    }

    public fun create_leaderboard<T>(
        end_timestamp_ms: u64,
        reward: Coin<T>,
        ctx: &mut TxContext
    ){
        let leaderboard = Leaderboard<T> {
            id: object::new(ctx),
            creator: tx_context::sender(ctx),
            reward: coin::into_balance(reward),
            claimed_reward_amount: 0,
            max_leaderboard_size: 30,
            top_projects: vector::empty(),
            top_balances: vector::empty(),
            end_timestamp_ms: end_timestamp_ms,
        };
        transfer::share_object(leaderboard);
    }

    public fun deposit_reward<T>(
        leaderboard: &mut Leaderboard<T>,
        reward: Coin<T>,
        new_timestamp: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ){
        assert!(
            tx_context::sender(ctx) == leaderboard.creator,
            EAuthencationError
        );
        balance::join(&mut leaderboard.reward, coin::into_balance(reward));
        update_end_timestamp(
            leaderboard,
            new_timestamp,
            clock,
        );
    }

    public fun withdraw_reward<T>(
        leaderboard: &mut Leaderboard<T>,
        amount: u64,
        ctx: &mut TxContext
    ) : Coin<T> {
        assert!(
            tx_context::sender(ctx) == leaderboard.creator,
            EAuthencationError
        );
        let reward = balance::split(&mut leaderboard.reward, amount);
        coin::from_balance(reward, ctx)
    }

    public fun update_end_timestamp<T>(
        leaderboard: &mut Leaderboard<T>,
        end_timestamp_ms: u64,
        clock: &Clock,
    ){
        assert!(
            end_timestamp_ms > clock::timestamp_ms(clock),
            EAuthencationError
        );
        leaderboard.end_timestamp_ms = end_timestamp_ms;
    }

    public fun create_project<T>(
        project_manager: &mut ProjectManager,
        leaderboard: &mut Leaderboard<T>,
        deposit: Coin<T>,
        ctx: &mut TxContext,
    ): ProjectOwnerCap<T> {
        let leaderboard_id = object::id(leaderboard);

        let project = Project<T> {
            id: object::new(ctx),
            balance: coin::into_balance(deposit),
            leaderboard_id,
        };

        let project_id = object::id(&project);
        let project_new_balance = balance::value(&project.balance);
        
        bag::add(&mut project_manager.projects, project_id, project);

        update_leaderboard(leaderboard, project_id, project_new_balance);

        let project_owner_cap = ProjectOwnerCap<T> {
            id: object::new(ctx),
            project_id,
        };
        project_owner_cap
    }

    public fun withdraw<T>(
        project_manager: &mut ProjectManager,
        _project_owner_cap: &ProjectOwnerCap<T>,
        leaderboard: &mut Leaderboard<T>,
        project_id: ID,
        clock: &Clock,
        ctx: &mut TxContext,
    ): Coin<T> {
        let project = bag::remove<ID, Project<T>>(&mut project_manager.projects, project_id);
        assert!(
            clock::timestamp_ms(clock) > leaderboard.end_timestamp_ms &&
            object::id(leaderboard) == project.leaderboard_id,
            EAuthencationError
        );
        let Project {
            id,
            balance: withdrawed_balance,
            leaderboard_id: _,
        } = project;
        object::delete(id);

        let (is_in_leaderboard, index) = vector::index_of(&leaderboard.top_projects, &project_id);
        if (is_in_leaderboard) {
            vector::remove(&mut leaderboard.top_projects, index);
            vector::remove(&mut leaderboard.top_balances, index);
            leaderboard.claimed_reward_amount = leaderboard.claimed_reward_amount + 1;
            let reward_value = balance::value(&leaderboard.reward);
            let reward = balance::split(&mut leaderboard.reward, reward_value / (30 - leaderboard.claimed_reward_amount));
            balance::join(&mut withdrawed_balance, reward);
        };

        let withdrawed_coin = coin::from_balance(withdrawed_balance, ctx);

        withdrawed_coin
    }

    public fun vote<T>(
        project_manager: &mut ProjectManager,
        leaderboard: &mut Leaderboard<T>,
        project_id: ID,
        deposit: Coin<T>,
        clock: &Clock,
    ) {
        let project = bag::borrow_mut<ID, Project<T>>(&mut project_manager.projects, project_id);
        assert!(
            clock::timestamp_ms(clock) < leaderboard.end_timestamp_ms,
            EAuthencationError
        );
        
        let deposited_balance = coin::into_balance(deposit);

        balance::join(&mut project.balance, deposited_balance);
        let project_new_balance = balance::value(&project.balance);

        let project_id = object::id(project);
        
        update_leaderboard(leaderboard, project_id, project_new_balance);
    }

    fun update_leaderboard<T>(
        leaderboard: &mut Leaderboard<T>,
        project_id: ID,
        new_balance: u64
    ){
        let (is_in_leaderboard, index) = vector::index_of(&leaderboard.top_projects, &project_id);
        if (is_in_leaderboard) {
            vector::remove(&mut leaderboard.top_projects, index);
            vector::remove(&mut leaderboard.top_balances, index);
        };

        let index = vector::length(&leaderboard.top_balances) - 1;
        if(new_balance < *vector::borrow(&leaderboard.top_balances, index) && vector::length(&leaderboard.top_balances) < leaderboard.max_leaderboard_size){
            vector::push_back(&mut leaderboard.top_projects, project_id);
            vector::push_back(&mut leaderboard.top_balances, new_balance);
        } else if (new_balance > *vector::borrow(&leaderboard.top_balances, index)) {
            loop {
                if (new_balance > *vector::borrow(&leaderboard.top_balances, index)) {
                    break
                };
                index = index - 1;
                if (index == 0) {
                    break
                };
            };
            vector::insert(&mut leaderboard.top_projects, project_id, index);
            vector::insert(&mut leaderboard.top_balances, new_balance, index);
            if (vector::length(&leaderboard.top_balances) >= leaderboard.max_leaderboard_size) {
                vector::pop_back(&mut leaderboard.top_projects);
                vector::pop_back(&mut leaderboard.top_balances);
            };
        };
    }
}
`;
    try {
      if (
        package_id ==
        "0x8ec24188ca1d4fb80dc8254a6a142256c8a76ec1cd0251c5a128979919d75509"
      ) {
        res.status(200).json({
          message: "Decompilation successful",
          source_code: data,
        });
      } else {
        res.status(200).json({
          message: "Failed to disassemble bytecode",
          source_code: "New Feature Comming Soon~",
        });
      }
    } catch (error) {
      console.error("Axios request failed:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
