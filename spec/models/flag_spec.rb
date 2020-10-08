# frozen_string_literal: true

require 'rails_helper'

describe Flag do
  before do
    clean_data(Flag, User, Child, TracingRequest, Incident, PrimeroModule, UserGroup, Agency)

    @primero_module = PrimeroModule.new(name: 'CP')
    @primero_module.save(validate: false)
    permission_case = Permission.new(resource: Permission::CASE, actions: [Permission::READ, Permission::WRITE])
    permission_read_flags = Permission.new(resource: Permission::DASHBOARD, actions: [Permission::DASH_FLAGS])
    @role = Role.new(permissions: [permission_case, permission_read_flags], modules: [@primero_module])
    @role.save(validate: false)
    @group1 = UserGroup.create!(name: 'Group1')
    @agency1 = Agency.create!(name: 'Agency One', agency_code: 'agency1')
    @user1 = User.new(user_name: 'user1', full_name: 'Test User One', location: 'loc012345', role: @role,
                      user_groups: [@group1], agency_id: @agency1.id)
    @user1.save(validate: false)
    @group2 = UserGroup.create!(name: 'Group2')
    @agency2 = Agency.create!(name: 'Agency Two', agency_code: 'agency2')
    @user2 = User.new(user_name: 'user2', full_name: 'Test User Two', location: 'loc8675309', role: @role,
                      user_groups: [@group1], agency_id: @agency2.id)
    @user2.save(validate: false)
    @user3 = User.new(user_name: 'user3', full_name: 'Test User Three', location: 'loc8675309', role: @role,
                      user_groups: [@group2], agency_id: @agency2.id)
    @user3.save(validate: false)
    @manager1 = User.new(user_name: 'manager1', full_name: 'Test Manager One', location: 'loc8675309', role: @role,
                         user_groups: [@group1], agency_id: @agency2.id)
    @manager1.save(validate: false)

    @case1 = Child.create!(data: { name: "Test1", age: 5, sex: 'male', owned_by: 'user1' })
    @case2 = Child.create!(data: { name: "Test2", age: 7, sex: 'female', owned_by: 'user1' })
    @case3 = Child.create!(data: { name: "Test3", age: 9, sex: 'female', owned_by: 'user2' })
    @case4 = Child.create!(data: { name: "Test4", age: 9, sex: 'female', owned_by: 'user2' })

    @tracing_request1 = TracingRequest.create!(data: { inquiry_date: Date.new(2019, 3, 1), relation_name: 'Test 1', owned_by: 'user1' })
    @tracing_request2 = TracingRequest.create!(data: { inquiry_date: Date.new(2018, 3, 1), relation_name: 'Test 2', owned_by: 'user2' })

    @incident1 = Incident.create!(data: { incident_date: Date.new(2019, 3, 1), description: 'Test 1', owned_by: 'user1' })
    @incident2 = Incident.create!(data: { incident_date: Date.new(2018, 3, 1), description: 'Test 2', owned_by: 'user2' })

    @case1.add_flag('This is a flag', Date.today, 'faketest')
    @case3.add_flag('This is a flag', Date.today, 'faketest')
    @tracing_request1.add_flag('This is a flag TR', Date.today, 'faketest')
    @incident1.add_flag('This is a flag IN', Date.today, 'faketest')
    @incident2.add_flag('This is a flag IN', Date.today, 'faketest')
  end

  describe 'by_owner' do
    context 'when the user has query user permissions' do
      before do
        @query_scope = {user: {'user' => 'user1'}, module: ['primeromodule-cp']}
      end

      context 'when record_types is passed in' do
        context 'and the record_type is cases' do
          before do
            @record_types = ['cases']
          end

          it 'returns case flags owned by or asssociated with the current user' do
            flags = Flag.by_owner(@query_scope, @record_types)
            expect(flags.size).to eq(1)
            expect(flags.first['record_id']).to eq( @case1.id.to_s)
            expect(flags.first['record_type']).to eq('Child')
            expect(flags.first['message']).to eq( 'This is a flag')
            expect(flags.first['removed']).to be_falsey
          end
        end
      end

      context 'when record_types is not passed in' do
        it 'returns flags owned by or asssociated with the current user' do
          flags = Flag.by_owner(@query_scope, nil)
          expect(flags.size).to eq(3)
          expect(flags.first['record_id']).to eq( @case1.id.to_s)
          expect(flags.first['record_type']).to eq('Child')
          expect(flags.first['message']).to eq( 'This is a flag')
          expect(flags.first['removed']).to be_falsey
        end
      end
    end

    context 'when the user has query group permissions' do
      # TODO
    end
  end

  after do
    clean_data(Flag, User, Child, TracingRequest, Incident, PrimeroModule, UserGroup, Agency)
  end
end