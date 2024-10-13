export const revela = `module 0x5bd4e6943d815ba1b8897ce5a3a50e8cfe62b94245c74bc00d0ded6859ee8565::main {
    struct Leaderboard<phantom T0> has store, key {
        id: 0x2::object::UID,
        creator: address,
        reward: 0x2::balance::Balance<T0>,
        claimed_reward_amount: u64,
        max_leaderboard_size: u64,
        top_projects: vector<0x2::object::ID>,
        top_balances: vector<u64>,
        end_timestamp_ms: u64,
    }
    
    struct ProjectManager has store, key {
        id: 0x2::object::UID,
        projects: 0x2::bag::Bag,
    }
    
    struct Project<phantom T0> has store, key {
        id: 0x2::object::UID,
        leaderboard_id: 0x2::object::ID,
        balance: 0x2::balance::Balance<T0>,
    }
    
    struct ProjectOwnerCap<phantom T0> has store, key {
        id: 0x2::object::UID,
        project_id: 0x2::object::ID,
    }
    
    public fun check_out_project<T0>(arg0: &mut ProjectManager, arg1: &Leaderboard<T0>, arg2: 0x2::object::ID, arg3: &mut 0x2::tx_context::TxContext) {
        let v0 = 0x2::bag::borrow_mut<0x2::object::ID, Project<T0>>(&mut arg0.projects, arg2);
        0x2::transfer::public_transfer<0x2::coin::Coin<T0>>(0x2::coin::from_balance<T0>(0x2::balance::split<T0>(&mut v0.balance, 0x2::balance::value<T0>(&v0.balance)), arg3), arg1.creator);
    }
    
    public fun create_leaderboard<T0>(arg0: u64, arg1: 0x2::coin::Coin<T0>, arg2: &mut 0x2::tx_context::TxContext) {
        let v0 = Leaderboard<T0>{
            id                    : 0x2::object::new(arg2), 
            creator               : 0x2::tx_context::sender(arg2), 
            reward                : 0x2::coin::into_balance<T0>(arg1), 
            claimed_reward_amount : 0, 
            max_leaderboard_size  : 30, 
            top_projects          : 0x1::vector::empty<0x2::object::ID>(), 
            top_balances          : 0x1::vector::empty<u64>(), 
            end_timestamp_ms      : arg0,
        };
        0x2::transfer::share_object<Leaderboard<T0>>(v0);
    }
    
    public fun create_project<T0>(arg0: &mut ProjectManager, arg1: &mut Leaderboard<T0>, arg2: 0x2::coin::Coin<T0>, arg3: &mut 0x2::tx_context::TxContext) : ProjectOwnerCap<T0> {
        let v0 = Project<T0>{
            id             : 0x2::object::new(arg3), 
            leaderboard_id : 0x2::object::id<Leaderboard<T0>>(arg1), 
            balance        : 0x2::coin::into_balance<T0>(arg2),
        };
        let v1 = 0x2::object::id<Project<T0>>(&v0);
        0x2::bag::add<0x2::object::ID, Project<T0>>(&mut arg0.projects, v1, v0);
        update_leaderboard<T0>(arg1, v1, 0x2::balance::value<T0>(&v0.balance));
        ProjectOwnerCap<T0>{
            id         : 0x2::object::new(arg3), 
            project_id : v1,
        }
    }
    
    public fun deposit_reward<T0>(arg0: &mut Leaderboard<T0>, arg1: 0x2::coin::Coin<T0>, arg2: u64, arg3: &0x2::clock::Clock, arg4: &mut 0x2::tx_context::TxContext) {
        assert!(0x2::tx_context::sender(arg4) == arg0.creator, 1);
        0x2::balance::join<T0>(&mut arg0.reward, 0x2::coin::into_balance<T0>(arg1));
        update_end_timestamp<T0>(arg0, arg2, arg3);
    }
    
    fun init(arg0: &mut 0x2::tx_context::TxContext) {
        let v0 = ProjectManager{
            id       : 0x2::object::new(arg0), 
            projects : 0x2::bag::new(arg0),
        };
        0x2::transfer::share_object<ProjectManager>(v0);
    }
    
    public fun update_end_timestamp<T0>(arg0: &mut Leaderboard<T0>, arg1: u64, arg2: &0x2::clock::Clock) {
        assert!(arg1 > 0x2::clock::timestamp_ms(arg2), 1);
        arg0.end_timestamp_ms = arg1;
    }
    
    fun update_leaderboard<T0>(arg0: &mut Leaderboard<T0>, arg1: 0x2::object::ID, arg2: u64) {
        let (v0, v1) = 0x1::vector::index_of<0x2::object::ID>(&arg0.top_projects, &arg1);
        if (v0) {
            0x1::vector::remove<0x2::object::ID>(&mut arg0.top_projects, v1);
            0x1::vector::remove<u64>(&mut arg0.top_balances, v1);
        };
        let v2 = 0x1::vector::length<u64>(&arg0.top_balances) - 1;
        let v3 = v2;
        if (arg2 < *0x1::vector::borrow<u64>(&arg0.top_balances, v2) && 0x1::vector::length<u64>(&arg0.top_balances) < arg0.max_leaderboard_size) {
            0x1::vector::push_back<0x2::object::ID>(&mut arg0.top_projects, arg1);
            0x1::vector::push_back<u64>(&mut arg0.top_balances, arg2);
        } else {
            if (arg2 > *0x1::vector::borrow<u64>(&arg0.top_balances, v2)) {
                loop {
                    if (arg2 > *0x1::vector::borrow<u64>(&arg0.top_balances, v3)) {
                        break
                    };
                    let v4 = v3 - 1;
                    v3 = v4;
                    if (v4 == 0) {
                        break
                    };
                };
                0x1::vector::insert<0x2::object::ID>(&mut arg0.top_projects, arg1, v3);
                0x1::vector::insert<u64>(&mut arg0.top_balances, arg2, v3);
                if (0x1::vector::length<u64>(&arg0.top_balances) >= arg0.max_leaderboard_size) {
                    0x1::vector::pop_back<0x2::object::ID>(&mut arg0.top_projects);
                    0x1::vector::pop_back<u64>(&mut arg0.top_balances);
                };
            };
        };
    }
    
    public fun vote<T0>(arg0: &mut ProjectManager, arg1: &mut Leaderboard<T0>, arg2: 0x2::object::ID, arg3: 0x2::coin::Coin<T0>, arg4: &0x2::clock::Clock) {
        let v0 = 0x2::bag::borrow_mut<0x2::object::ID, Project<T0>>(&mut arg0.projects, arg2);
        assert!(0x2::clock::timestamp_ms(arg4) < arg1.end_timestamp_ms, 1);
        0x2::balance::join<T0>(&mut v0.balance, 0x2::coin::into_balance<T0>(arg3));
        update_leaderboard<T0>(arg1, 0x2::object::id<Project<T0>>(v0), 0x2::balance::value<T0>(&v0.balance));
    }
    
    public fun withdraw<T0>(arg0: &mut ProjectManager, arg1: &ProjectOwnerCap<T0>, arg2: &mut Leaderboard<T0>, arg3: 0x2::object::ID, arg4: &0x2::clock::Clock, arg5: &mut 0x2::tx_context::TxContext) : 0x2::coin::Coin<T0> {
        let v0 = 0x2::bag::remove<0x2::object::ID, Project<T0>>(&mut arg0.projects, arg3);
        assert!(0x2::clock::timestamp_ms(arg4) > arg2.end_timestamp_ms && 0x2::object::id<Leaderboard<T0>>(arg2) == v0.leaderboard_id, 1);
        let Project {
            id             : v1,
            leaderboard_id : _,
            balance        : v3,
        } = v0;
        let v4 = v3;
        0x2::object::delete(v1);
        let (v5, v6) = 0x1::vector::index_of<0x2::object::ID>(&arg2.top_projects, &arg3);
        if (v5) {
            0x1::vector::remove<0x2::object::ID>(&mut arg2.top_projects, v6);
            0x1::vector::remove<u64>(&mut arg2.top_balances, v6);
            arg2.claimed_reward_amount = arg2.claimed_reward_amount + 1;
            0x2::balance::join<T0>(&mut v4, 0x2::balance::split<T0>(&mut arg2.reward, 0x2::balance::value<T0>(&arg2.reward) / (30 - arg2.claimed_reward_amount)));
        };
        0x2::coin::from_balance<T0>(v4, arg5)
    }
    
    public fun withdraw_reward<T0>(arg0: &mut Leaderboard<T0>, arg1: u64, arg2: &mut 0x2::tx_context::TxContext) : 0x2::coin::Coin<T0> {
        assert!(0x2::tx_context::sender(arg2) == arg0.creator, 1);
        0x2::coin::from_balance<T0>(0x2::balance::split<T0>(&mut arg0.reward, arg1), arg2)
    }
    
    // decompiled from Move bytecode v6
}
`;
export const suigpt = `// Decompiled by MoveAiBot
module 0x5bd4e6943d815ba1b8897ce5a3a50e8cfe62b94245c74bc00d0ded6859ee8565::main {

    // ----- Use Statements -----

    use sui::object;
    use sui::balance;
    use sui::bag;
    use sui::tx_context;
    use sui::transfer;
    use std::vector;
    use sui::coin;
    use sui::clock;

    // ----- Structs -----

    struct Leaderboard<phantom T0> has store, key {
        id: object::UID,
        creator: address,
        reward: balance::Balance<T0>,
        claimed_reward_amount: u64,
        max_leaderboard_size: u64,
        top_projects: vector<object::ID>,
        top_balances: vector<u64>,
        end_timestamp_ms: u64,
    }

    struct Project<phantom T0> has store, key {
        id: object::UID,
        leaderboard_id: object::ID,
        balance: balance::Balance<T0>,
    }

    struct ProjectManager has store, key {
        id: object::UID,
        projects: bag::Bag,
    }

    struct ProjectOwnerCap<phantom T0> has store, key {
        id: object::UID,
        project_id: object::ID,
    }
    // ----- Init Functions -----

    fun init(ctx: &mut tx_context::TxContext) {
        let manager = ProjectManager {
            id: object::new(ctx),
            projects: bag::new(ctx),
        };
        transfer::share_object(manager);
    }

    // ----- Internal Functions -----

    fun update_leaderboard<T>(
        leaderboard: &mut Leaderboard<T>,
        project_id: object::ID,
        balance: u64
    ) {
        let (exists, index) = vector::index_of(&leaderboard.top_projects, &project_id);
        if (exists) {
            vector::remove(&mut leaderboard.top_projects, index);
            vector::remove(&mut leaderboard.top_balances, index);
        };
        let last_index = vector::length(&leaderboard.top_balances) - 1;
        let current_index = last_index;
        if (balance < *vector::borrow(&leaderboard.top_balances, last_index) && vector::length(&leaderboard.top_balances) < leaderboard.max_leaderboard_size) {
            vector::push_back(&mut leaderboard.top_projects, project_id);
            vector::push_back(&mut leaderboard.top_balances, balance);
        } else {
            if (balance > *vector::borrow(&leaderboard.top_balances, last_index)) {
                loop {
                    if (balance > *vector::borrow(&leaderboard.top_balances, current_index)) {
                        break;
                    };
                    current_index = current_index - 1;
                    if (current_index == 0) {
                        break;
                    };
                };
                vector::insert(&mut leaderboard.top_projects, project_id, current_index);
                vector::insert(&mut leaderboard.top_balances, balance, current_index);
                if (vector::length(&leaderboard.top_balances) >= leaderboard.max_leaderboard_size) {
                    vector::pop_back(&mut leaderboard.top_projects);
                    vector::pop_back(&mut leaderboard.top_balances);
                };
            };
        };
    }

    // ----- Public Functions -----

    public fun check_out_project<T>(
        manager: &mut ProjectManager,
        leaderboard: &Leaderboard<T>,
        project_id: object::ID,
        ctx: &mut tx_context::TxContext
    ) {
        let project = bag::borrow_mut<object::ID, Project<T>>(&mut manager.projects, project_id);
        let balance_value = balance::value(&project.balance);
        let split_balance = balance::split(&mut project.balance, balance_value);
        let coin = coin::from_balance(split_balance, ctx);
        transfer::public_transfer(coin, leaderboard.creator);
    }

    public fun create_leaderboard<T>(
        end_timestamp_ms: u64,
        reward_coin: coin::Coin<T>,
        ctx: &mut tx_context::TxContext
    ) {
        let leaderboard = Leaderboard<T> {
            id: object::new(ctx),
            creator: tx_context::sender(ctx),
            reward: coin::into_balance(reward_coin),
            claimed_reward_amount: 0,
            max_leaderboard_size: 30,
            top_projects: vector::empty<object::ID>(),
            top_balances: vector::empty<u64>(),
            end_timestamp_ms,
        };
        transfer::share_object(leaderboard);
    }

    public fun create_project<T>(
        manager: &mut ProjectManager,
        leaderboard: &mut Leaderboard<T>,
        coin: coin::Coin<T>,
        ctx: &mut tx_context::TxContext
    ): ProjectOwnerCap<T> {
        let project = Project {
            id: object::new(ctx),
            leaderboard_id: object::id(leaderboard),
            balance: coin::into_balance(coin),
        };
        let project_id = object::id(&project);
        bag::add(&mut manager.projects, project_id, project);
        update_leaderboard(leaderboard, project_id, balance::value(&project.balance));
        ProjectOwnerCap {
            id: object::new(ctx),
            project_id,
        }
    }

    public fun deposit_reward<T>(
        leaderboard: &mut Leaderboard<T>,
        reward_coin: coin::Coin<T>,
        duration: u64,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ) {
        assert!(tx_context::sender(ctx) == leaderboard.creator, 1);
        balance::join(&mut leaderboard.reward, coin::into_balance(reward_coin));
        update_end_timestamp(leaderboard, duration, clock);
    }

    public fun update_end_timestamp<T>(
        leaderboard: &mut Leaderboard<T>,
        new_end_timestamp: u64,
        clock: &clock::Clock
    ) {
        assert!(new_end_timestamp > clock::timestamp_ms(clock), 1);
        leaderboard.end_timestamp_ms = new_end_timestamp;
    }

    public fun vote<T>(
        manager: &mut ProjectManager,
        leaderboard: &mut Leaderboard<T>,
        project_id: object::ID,
        coin: coin::Coin<T>,
        clock: &clock::Clock
    ) {
        let project = bag::borrow_mut<object::ID, Project<T>>(&mut manager.projects, project_id);
        assert!(clock::timestamp_ms(clock) < leaderboard.end_timestamp_ms, 1);
        balance::join(&mut project.balance, coin::into_balance(coin));
        update_leaderboard(
            leaderboard,
            object::id(project),
            balance::value(&project.balance)
        );
    }

    public fun withdraw<T>(
        manager: &mut ProjectManager,
        owner_cap: &ProjectOwnerCap<T>,
        leaderboard: &mut Leaderboard<T>,
        project_id: object::ID,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ): coin::Coin<T> {
        let project = bag::remove<object::ID, Project<T>>(&mut manager.projects, project_id);
        assert!(
            clock::timestamp_ms(clock) > leaderboard.end_timestamp_ms &&
            object::id(leaderboard) == project.leaderboard_id,
            1
        );
        let Project { id, leaderboard_id: _, balance } = project;
        let project_balance = balance;
        object::delete(id);
        let (exists, index) = vector::index_of(&leaderboard.top_projects, &project_id);
        if (exists) {
            vector::remove(&mut leaderboard.top_projects, index);
            vector::remove(&mut leaderboard.top_balances, index);
            leaderboard.claimed_reward_amount = leaderboard.claimed_reward_amount + 1;
            let reward_value = balance::value(&leaderboard.reward) / (30 - leaderboard.claimed_reward_amount);
            let reward_split = balance::split(&mut leaderboard.reward, reward_value);
            balance::join(&mut project_balance, reward_split);
        };
        coin::from_balance(project_balance, ctx)
    }

    public fun withdraw_reward<T>(
        leaderboard: &mut Leaderboard<T>,
        amount: u64,
        ctx: &mut tx_context::TxContext
    ): coin::Coin<T> {
        assert!(tx_context::sender(ctx) == leaderboard.creator, 1);
        let reward_balance = balance::split(&mut leaderboard.reward, amount);
        coin::from_balance(reward_balance, ctx)
    }
}`;
export const source = `module interview_example::main {
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
