using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SimplyFly.API.Migrations
{
    public partial class AddFlightOwner : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FlightOwnerId",
                table: "Flights",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Flights_FlightOwnerId",
                table: "Flights",
                column: "FlightOwnerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Flights_Users_FlightOwnerId",
                table: "Flights",
                column: "FlightOwnerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Flights_Users_FlightOwnerId",
                table: "Flights");

            migrationBuilder.DropIndex(
                name: "IX_Flights_FlightOwnerId",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "FlightOwnerId",
                table: "Flights");
        }
    }
}
