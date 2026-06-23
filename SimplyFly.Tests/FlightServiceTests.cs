using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using SimplyFly.API.Data;
using SimplyFly.API.DTOs;
using SimplyFly.API.Models;
using SimplyFly.API.Services.Implementations;

namespace SimplyFly.Tests
{
    [TestFixture]
    public class FlightServiceTests
    {
        private ApplicationDbContext _context;
        private FlightService _flightService;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _flightService = new FlightService(_context);

            _context.Flights.AddRange(
                new Flight
                {
                    Id = 1,
                    FlightNumber = "SF101",
                    FlightName = "SimplyFly One",
                    Origin = "Hyderabad",
                    Destination = "Bangalore",
                    DepartureTime = new DateTime(2026, 6, 22, 10, 0, 0),
                    ArrivalTime = new DateTime(2026, 6, 22, 11, 30, 0),
                    Fare = 5000,
                    TotalSeats = 10,
                    AvailableSeats = 10
                },
                new Flight
                {
                    Id = 2,
                    FlightNumber = "SF102",
                    FlightName = "SimplyFly Two",
                    Origin = "Hyderabad",
                    Destination = "Chennai",
                    DepartureTime = new DateTime(2026, 6, 22, 12, 0, 0),
                    ArrivalTime = new DateTime(2026, 6, 22, 13, 30, 0),
                    Fare = 4500,
                    TotalSeats = 20,
                    AvailableSeats = 20
                },
                new Flight
                {
                    Id = 3,
                    FlightNumber = "SF103",
                    FlightName = "SimplyFly Three",
                    Origin = "Delhi",
                    Destination = "Mumbai",
                    DepartureTime = new DateTime(2026, 6, 23, 9, 0, 0),
                    ArrivalTime = new DateTime(2026, 6, 23, 11, 0, 0),
                    Fare = 7000,
                    TotalSeats = 15,
                    AvailableSeats = 15
                });

            _context.SaveChanges();
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public void When_AddFlight_ValidDetails_AddsFlightSuccessfully()
        {
            // Arrange
            AddFlightDto dto = new AddFlightDto
            {
                FlightNumber = "SF104",
                FlightName = "SimplyFly Four",
                Origin = "Pune",
                Destination = "Goa",
                DepartureTime = DateTime.Now.AddHours(5),
                ArrivalTime = DateTime.Now.AddHours(7),
                Fare = 3500,
                TotalSeats = 25
            };

            // Act
            ApiResponse<Flight> result = _flightService.AddFlight(dto);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Message, Is.EqualTo("Flight Added Successfully"));
            Assert.That(_context.Flights.Count(), Is.EqualTo(4));
            Assert.That(_context.Flights.Last().FlightNumber, Is.EqualTo("SF104"));
            Assert.That(_context.Flights.Last().AvailableSeats, Is.EqualTo(25));
        }

        [Test]
        public void When_GetAllFlights_WithOriginFilter_ReturnsMatchingFlights()
        {
            // Act
            ApiResponse<object> result = _flightService.GetAllFlights(1, 10, "Hyderabad", null);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Message, Is.EqualTo("Flights fetched successfully"));
        }

        [Test]
        public void When_GetAllFlights_WithFareSort_ReturnsFlights()
        {
            // Act
            ApiResponse<object> result = _flightService.GetAllFlights(1, 10, null, "fare");

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Message, Is.EqualTo("Flights fetched successfully"));
        }

        [Test]
        public void When_SearchFlights_ValidSearch_ReturnsMatchingFlights()
        {
            // Act
            ApiResponse<List<Flight>> result = _flightService.SearchFlights(
                "Hyderabad",
                "Bangalore",
                new DateTime(2026, 6, 22));

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data, Is.Not.Null);
            Assert.That(result.Data.Count, Is.EqualTo(1));
            Assert.That(result.Data[0].FlightNumber, Is.EqualTo("SF101"));
        }

        [Test]
        public void When_SearchFlights_NoMatch_ReturnsEmptyList()
        {
            // Act
            ApiResponse<List<Flight>> result = _flightService.SearchFlights(
                "Mumbai",
                "Delhi",
                new DateTime(2026, 6, 25));

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data, Is.Not.Null);
            Assert.That(result.Data.Count, Is.EqualTo(0));
        }

        [Test]
        public void When_GetAllFlights_WithInvalidSortOption_StillReturnsFlights()
        {
            // Act
            ApiResponse<object> result = _flightService.GetAllFlights(1, 10, null, "invalid");

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Message, Is.EqualTo("Flights fetched successfully"));
        }
    }
}
